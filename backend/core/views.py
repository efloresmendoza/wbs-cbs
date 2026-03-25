from io import BytesIO
import pandas as pd

from django.core.files.base import ContentFile
from django.db import transaction
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, PlanningUpload, PlanningExtractRow
from .serializers import (
    ProjectSerializer,
    PlanningUploadSerializer,
    PlanningExtractRowSerializer,
)
from .services import parse_excel_file, extract_planning_rows, process_wbs_hierarchy


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-updated_at")
    serializer_class = ProjectSerializer


class PlanningUploadView(APIView):
    """
    Handles hierarchical planning registers:
    - Program headers
    - WBS summary rows
    - Activities / milestones
    """

    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)

        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided"}, status=400)

        file_content = file.read()

        upload = PlanningUpload.objects.create(
            project=project,
            file=ContentFile(file_content, name=file.name),
        )

        try:
            df = parse_excel_file(file_content, file.name)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)

        try:
            rows_to_create = extract_planning_rows(df, project, upload)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)

        # Wrap delete + bulk_create in transaction.atomic
        try:
            with transaction.atomic():
                # Delete existing rows for this project
                PlanningExtractRow.objects.filter(project=project).delete()
                
                # Bulk create new rows
                batch_size = 1000
                total_created = 0
                
                for i in range(0, len(rows_to_create), batch_size):
                    batch = rows_to_create[i:i + batch_size]
                    PlanningExtractRow.objects.bulk_create(batch)
                    total_created += len(batch)
        except Exception as e:
            return Response({"error": f"Failed to save data: {str(e)}"}, status=500)

        return Response(
            {
                "message": "File uploaded successfully",
                "rows_created": total_created,
            },
            status=201,
        )


class PlanningProcessView(APIView):
    """
    Populates WBS hierarchy safely (clears deeper levels)
    """

    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)

        try:
            with transaction.atomic():
                # Process WBS hierarchy with bulk_update
                num_updated = process_wbs_hierarchy(project)
                
                # Mark project as WBS loaded
                project.wbs_loaded = True
                project.save(update_fields=["wbs_loaded"])
        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response({"error": f"Failed to process WBS: {str(e)}"}, status=500)

        return Response(
            {
                "message": "WBS hierarchy processed",
                "rows_updated": num_updated,
            },
            status=200,
        )


class PlanningExtractView(APIView):
    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)

        qs = PlanningExtractRow.objects.filter(project=project)

        # Filter by activity name (search term)
        activity_name = request.query_params.get("activity_name")
        if activity_name:
            qs = qs.filter(activity_name__icontains=activity_name)

        # Filter by WBS overlay hierarchy levels (1-5)
        for level in range(1, 6):
            level_value = request.query_params.get(f"wbs_level_{level}")
            if level_value:
                qs = qs.filter(**{f"wbs_level_{level}": level_value})

        # Legacy CSP: allow WBS contains filtering if still used by clients
        wbs_contains = request.query_params.get("wbs_contains")
        if wbs_contains:
            qs = qs.filter(wbs__icontains=wbs_contains)

        serializer = PlanningExtractRowSerializer(qs, many=True)
        return Response(serializer.data)


class PlanningTemplateView(APIView):
    def get(self, request):
        # Create sample data
        sample_data = [
            ['1', 'Project Initiation', 'ACT001', 'Kickoff Meeting', '2024-01-01', '2024-01-05', '', '', '', '', 1],
            ['1.1', 'Requirements Gathering', 'ACT002', 'Gather Requirements', '2024-01-06', '2024-01-15', '', '', '', '', 2],
            ['1.2', 'Project Planning', 'ACT003', 'Create Project Plan', '2024-01-16', '2024-01-25', '', '', '', '', 2],
            ['2', 'Development Phase', 'ACT004', 'Development Start', '2024-01-26', '2024-02-10', '', '', '', '', 1],
            ['2.1', 'Design', 'ACT005', 'System Design', '2024-02-11', '2024-02-20', '', '', '', '', 2],
            ['2.1.1', 'UI Design', 'ACT006', 'User Interface Design', '2024-02-21', '2024-03-01', '', '', '', '', 3],
            ['2.1.2', 'Database Design', 'ACT007', 'Database Schema', '2024-03-02', '2024-03-10', '', '', '', '', 3],
        ]
        
        columns = [
            'WBS', 'WBS Name', 'Activity ID', 'Activity Name', 'Start', 'Finish',
            'link_01', 'link_02', 'link_03', 'link_04', 'Wbs Level'
        ]
        df = pd.DataFrame(sample_data, columns=columns)
        
        # Create Excel file in memory
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Planning Template')
        output.seek(0)
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="planning_template.xlsx"'
        return response
