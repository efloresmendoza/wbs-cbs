from io import BytesIO
import pandas as pd

from django.core.files.base import ContentFile
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
            if file.name.lower().endswith(".xlsx"):
                df = pd.read_excel(BytesIO(file_content), engine="openpyxl")
            elif file.name.lower().endswith(".xls"):
                df = pd.read_excel(BytesIO(file_content), engine="xlrd")
            else:
                return Response({"error": "Unsupported file format. Supported formats: .xlsx, .xls"}, status=400)
        except Exception as e:
            return Response({"error": f"Invalid Excel file: {e}"}, status=400)

        # Normalize column names to lowercase for case-insensitive matching
        df.columns = df.columns.str.strip()
        column_map = {col.lower(): col for col in df.columns}

        required_cols = ["wbs", "wbs name"]
        for col in required_cols:
            if col not in column_map:
                return Response({"error": f"Missing required column: {col.title()}. Available columns: {list(df.columns)}"}, status=400)

        rows_to_create = []

        for _, r in df.iterrows():
            wbs_raw = str(r.get(column_map["wbs"], "")).strip()
            wbs_name = str(r.get(column_map["wbs name"], "")).strip()

            activity_id = str(r.get(column_map.get("activity id", "Activity ID"), "")).strip() or None
            activity_name = str(r.get(column_map.get("activity name", "Activity Name"), "")).strip() or None

            start_raw = str(r.get(column_map.get("start", "Start"), "")).strip() or None
            finish_raw = str(r.get(column_map.get("finish", "Finish"), "")).strip() or None

            # ---------- WBS LEVEL ----------
            wbs_level = None
            wbs_level_key = column_map.get("wbs level") or column_map.get("wbs_level")
            if wbs_level_key:
                try:
                    wbs_level = int(float(r.get(wbs_level_key)))
                except Exception:
                    wbs_level = None

            if wbs_level is None and wbs_raw:
                if "." in wbs_raw:
                    wbs_level = len(wbs_raw.split("."))
                else:
                    wbs_level = 1

            rows_to_create.append(
                PlanningExtractRow(
                    project=project,
                    upload=upload,
                    wbs=wbs_raw,
                    wbs_name=wbs_name,
                    activity_id=activity_id,
                    activity_name=activity_name,
                    start=start_raw,
                    finish=finish_raw,
                    wbs_level=wbs_level,
                    # hierarchy populated later
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
                    # clean dates to be filled later
                    start_date_clean=None,
                    end_date_clean=None,
                )
            )

        # Process in batches to avoid memory issues with very large files
        batch_size = 1000
        total_created = 0

        # Only now replace project rows
        PlanningExtractRow.objects.filter(project=project).delete()

        for i in range(0, len(rows_to_create), batch_size):
            batch = rows_to_create[i:i + batch_size]
            PlanningExtractRow.objects.bulk_create(batch)
            total_created += len(batch)

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

        rows = PlanningExtractRow.objects.filter(project=project).order_by("id")
        if not rows.exists():
            return Response({"error": "No rows found"}, status=400)

        current_levels = {}

        for row in rows:
            # Prefer explicit wbs_level; fallback to code-derived depth when available
            if row.wbs_level and row.wbs_level > 0:
                level = row.wbs_level
            elif row.wbs:
                level = len([segment for segment in row.wbs.split('.') if segment.strip()])
                row.wbs_level = level
            else:
                level = 0

            # If WBS code is present, derive ancestor branches from its dot-hierarchy core
            if row.wbs:
                segments = [segment.strip() for segment in row.wbs.split('.') if segment.strip()]
                for i in range(1, 11):
                    if i <= len(segments):
                        current_levels[i] = '.'.join(segments[:i])
                    else:
                        current_levels.pop(i, None)
            elif level > 0:
                # preserve parent levels (no new code) but clear deeper ones
                for i in range(level + 1, 11):
                    current_levels.pop(i, None)

            for i in range(1, 11):
                setattr(row, f"wbs_level_{i}", current_levels.get(i))

            row.wbs_level = level
            row.save(update_fields=[
                "wbs_level",
                "wbs_level_1",
                "wbs_level_2",
                "wbs_level_3",
                "wbs_level_4",
                "wbs_level_5",
                "wbs_level_6",
                "wbs_level_7",
                "wbs_level_8",
                "wbs_level_9",
                "wbs_level_10",
            ])

        project.wbs_loaded = True
        project.save(update_fields=["wbs_loaded"])

        return Response({"message": "WBS hierarchy processed"}, status=200)


class PlanningExtractView(APIView):
    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)

        qs = PlanningExtractRow.objects.filter(project=project)

        # Optional filters can be added here later
        # row_type = request.query_params.get("row_type")
        # if row_type:
        #     qs = qs.filter(row_type=row_type)

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
