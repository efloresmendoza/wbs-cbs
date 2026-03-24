from django.db import models


class Project(models.Model):
    class MappingStatus(models.TextChoices):
        NOT_STARTED = "NOT_STARTED", "Not Started"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        LOCKED = "LOCKED", "Locked"

    project_id = models.CharField(max_length=128, unique=True)
    project_name = models.CharField(max_length=256)
    project_group = models.CharField(max_length=256, blank=True, null=True)
    wbs_loaded = models.BooleanField(default=False)
    cbs_loaded = models.BooleanField(default=False)
    mapping_status = models.CharField(
        max_length=16,
        choices=MappingStatus.choices,
        default=MappingStatus.NOT_STARTED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.project_name} ({self.project_id})"


class PlanningUpload(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    file = models.FileField(upload_to='planning_uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)


class PlanningExtractRow(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    upload = models.ForeignKey(PlanningUpload, on_delete=models.CASCADE)
    wbs = models.CharField(max_length=256)
    wbs_name = models.CharField(max_length=256)
    activity_id = models.CharField(max_length=256, blank=True, null=True)
    activity_name = models.CharField(max_length=256, blank=True, null=True)
    start = models.CharField(max_length=256, blank=True, null=True)
    finish = models.CharField(max_length=256, blank=True, null=True)
    link_01 = models.CharField(max_length=256, blank=True, null=True)
    link_02 = models.CharField(max_length=256, blank=True, null=True)
    link_03 = models.CharField(max_length=256, blank=True, null=True)
    link_04 = models.CharField(max_length=256, blank=True, null=True)
    start_date_clean = models.DateField(blank=True, null=True)
    end_date_clean = models.DateField(blank=True, null=True)
    wbs_level = models.IntegerField()
    wbs_level_1 = models.CharField(max_length=256, blank=True, null=True)
    wbs_level_2 = models.CharField(max_length=256, blank=True, null=True)
    wbs_level_3 = models.CharField(max_length=256, blank=True, null=True)
    wbs_level_4 = models.CharField(max_length=256, blank=True, null=True)
    wbs_level_5 = models.CharField(max_length=256, blank=True, null=True)
    wbs_level_6 = models.CharField(max_length=256, blank=True, null=True)
    wbs_level_7 = models.CharField(max_length=256, blank=True, null=True)
    wbs_level_8 = models.CharField(max_length=256, blank=True, null=True)
    wbs_level_9 = models.CharField(max_length=256, blank=True, null=True)
    wbs_level_10 = models.CharField(max_length=256, blank=True, null=True)
    cbs_1 = models.CharField(max_length=256, blank=True, null=True)
    cbs_2 = models.CharField(max_length=256, blank=True, null=True)
    control_account = models.CharField(max_length=256, blank=True, null=True)
    control_account_name = models.CharField(max_length=256, blank=True, null=True)
