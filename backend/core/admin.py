from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "project_name",
        "project_id",
        "project_group",
        "wbs_loaded",
        "cbs_loaded",
        "mapping_status",
        "updated_at",
    )
    list_filter = ("wbs_loaded", "cbs_loaded", "mapping_status", "project_group")
    search_fields = ("project_name", "project_id", "project_group")
