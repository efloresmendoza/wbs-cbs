from datetime import datetime
from io import BytesIO

import pandas as pd
from django.core.files.base import ContentFile
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PlanningExtractRow, PlanningUpload, Project
from .serializers import PlanningExtractRowSerializer, PlanningUploadSerializer, ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-updated_at")
    serializer_class = ProjectSerializer


class PlanningUploadView(APIView):
    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Read file content first
        file_content = file.read()

        # Save upload
        upload = PlanningUpload.objects.create(project=project, file=ContentFile(file_content, name=file.name))

        # Process and store raw planning rows for preview (no WBS split yet)
        try:
            if file.name.lower().endswith('.xlsx'):
                df = pd.read_excel(BytesIO(file_content), engine='openpyxl')
            elif file.name.lower().endswith('.xls'):
                df = pd.read_excel(BytesIO(file_content), engine='xlrd')
            else:
                return Response({"error": "Unsupported file format. Please upload .xlsx or .xls files."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Invalid Excel file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        required_cols = ['WBS', 'WBS Name', 'Activity ID', 'Activity Name', 'Start', 'Finish']
        if not all(col in df.columns for col in required_cols):
            return Response({"error": f"Missing required columns: {required_cols}"}, status=status.HTTP_400_BAD_REQUEST)

        PlanningExtractRow.objects.filter(project=project).delete()

        rows = []
        for _, row in df.iterrows():
            wbs_clean = str(row['WBS']).strip()
            wbs_name = str(row['WBS Name']).strip()
            activity_id = str(row.get('Activity ID', '')).strip() or None
            activity_name = str(row.get('Activity Name', '')).strip() or None
            start = str(row.get('Start', '')).strip() or None
            finish = str(row.get('Finish', '')).strip() or None

            wbs_level = None
            if 'Wbs Level' in df.columns:
                try:
                    wbs_level = int(float(row['Wbs Level']))
                except:
                    wbs_level = None

            start_date_clean = None
            end_date_clean = None
            if start:
                try:
                    start_date_clean = pd.to_datetime(start).date()
                except:
                    pass
            if finish:
                try:
                    end_date_clean = pd.to_datetime(finish).date()
                except:
                    pass

            rows.append(PlanningExtractRow(
                project=project,
                upload=upload,
                wbs=wbs_clean,
                wbs_name=wbs_name,
                activity_id=activity_id,
                activity_name=activity_name,
                start=start,
                finish=finish,
                link_01=row.get('link_01'),
                link_02=row.get('link_02'),
                link_03=row.get('link_03'),
                link_04=row.get('link_04'),
                start_date_clean=start_date_clean,
                end_date_clean=end_date_clean,
                wbs_level=wbs_level,
                wbs_level_1=None,
                wbs_level_2=None,
                wbs_level_3=None,
                wbs_level_4=None,
                wbs_level_5=None,
                wbs_level_6=None,
                wbs_level_7=None,
                wbs_level_8=None,
                wbs_level_9=None,
                wbs_level_10=None,
                cbs_1=None,
                cbs_2=None,
                control_account=None,
                control_account_name=None,
            ))

        PlanningExtractRow.objects.bulk_create(rows)

        return Response({"message": "File uploaded and preview rows created. Click 'Process WBS Levels' to fill hierarchy."}, status=status.HTTP_201_CREATED)


class PlanningProcessView(APIView):
    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        rows = PlanningExtractRow.objects.filter(project=project).order_by('id')
        if not rows.exists():
            return Response({"error": "No planning rows found for this project"}, status=status.HTTP_400_BAD_REQUEST)

        wbs_levels = {}
        updated_count = 0

        for row in rows:
            level = row.wbs_level
            if level is None:
                if row.wbs and '.' in row.wbs:
                    level = len(row.wbs.split('.'))
                elif row.wbs:
                    level = 1
                else:
                    level = 1

            wbs_levels[level] = row.wbs

            for i in range(1, 11):
                setattr(row, f'wbs_level_{i}', wbs_levels.get(i))

            row.wbs_level = level
            row.save(update_fields=[
                'wbs_level',
                'wbs_level_1',
                'wbs_level_2',
                'wbs_level_3',
                'wbs_level_4',
                'wbs_level_5',
                'wbs_level_6',
                'wbs_level_7',
                'wbs_level_8',
                'wbs_level_9',
                'wbs_level_10',
            ])
            updated_count += 1

        project.wbs_loaded = True
        project.save(update_fields=['wbs_loaded'])

        return Response({"message": f"Processed WBS levels for {updated_count} rows."}, status=status.HTTP_200_OK)


class PlanningExtractView(APIView):
    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        queryset = PlanningExtractRow.objects.filter(project=project)

        # Filters
        wbs_contains = request.query_params.get('wbs_contains')
        if wbs_contains:
            queryset = queryset.filter(wbs__icontains=wbs_contains)

        wbs_level_1 = request.query_params.get('wbs_level_1')
        if wbs_level_1:
            queryset = queryset.filter(wbs_level_1=wbs_level_1)

        wbs_level_2 = request.query_params.get('wbs_level_2')
        if wbs_level_2:
            queryset = queryset.filter(wbs_level_2=wbs_level_2)

        cbs_contains = request.query_params.get('cbs_contains')
        # For now, no filtering since CBS is empty

        serializer = PlanningExtractRowSerializer(queryset, many=True)
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
