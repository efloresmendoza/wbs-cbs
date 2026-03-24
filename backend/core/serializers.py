from rest_framework import serializers

from .models import PlanningExtractRow, PlanningUpload, Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "project_id",
            "project_name",
            "project_group",
            "wbs_loaded",
            "cbs_loaded",
            "mapping_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PlanningUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanningUpload
        fields = ["id", "project", "file", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class PlanningExtractRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanningExtractRow
        fields = "__all__"
