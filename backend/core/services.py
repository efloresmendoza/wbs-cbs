"""
Services for planning data processing and WBS hierarchy management.
"""
from io import BytesIO
import pandas as pd

from .models import PlanningExtractRow


def parse_excel_file(file_content, file_name):
    """
    Parse Excel file and return DataFrame.
    
    Args:
        file_content: Raw file content (bytes)
        file_name: Name of the file
        
    Returns:
        DataFrame with normalized column names
        
    Raises:
        ValueError: If file format is unsupported or invalid
    """
    try:
        if file_name.lower().endswith(".xlsx"):
            df = pd.read_excel(BytesIO(file_content), engine="openpyxl")
        elif file_name.lower().endswith(".xls"):
            df = pd.read_excel(BytesIO(file_content), engine="xlrd")
        else:
            raise ValueError("Unsupported file format. Supported formats: .xlsx, .xls")
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Invalid Excel file: {e}")
    
    # Normalize column names
    df.columns = df.columns.str.strip()
    return df


def extract_planning_rows(df, project, upload):
    """
    Extract planning rows from DataFrame and return list of PlanningExtractRow objects.
    
    Args:
        df: DataFrame with planning data
        project: Project instance
        upload: PlanningUpload instance
        
    Returns:
        List of PlanningExtractRow objects (not saved to DB)
        
    Raises:
        ValueError: If required columns are missing
    """
    # Create case-insensitive column mapping
    column_map = {col.lower(): col for col in df.columns}
    
    # Validate required columns
    required_cols = ["wbs", "wbs name"]
    for col in required_cols:
        if col not in column_map:
            raise ValueError(
                f"Missing required column: {col.title()}. "
                f"Available columns: {list(df.columns)}"
            )
    
    rows_to_create = []
    
    for _, r in df.iterrows():
        wbs_raw = str(r.get(column_map["wbs"], "")).strip()
        wbs_name = str(r.get(column_map["wbs name"], "")).strip()
        
        activity_id = str(r.get(column_map.get("activity id", "Activity ID"), "")).strip() or None
        activity_name = str(r.get(column_map.get("activity name", "Activity Name"), "")).strip() or None
        
        start_raw = str(r.get(column_map.get("start", "Start"), "")).strip() or None
        finish_raw = str(r.get(column_map.get("finish", "Finish"), "")).strip() or None
        
        # Calculate WBS level
        wbs_level = _calculate_wbs_level(r, column_map, wbs_raw)
        
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
    
    return rows_to_create


def process_wbs_hierarchy(project):
    """
    Process WBS hierarchy for a project using bulk_update.
    
    Updates all rows with their corresponding WBS level values based on
    the hierarchical structure.
    
    Args:
        project: Project instance
        
    Returns:
        Number of rows updated
        
    Raises:
        ValueError: If no rows found for project
    """
    rows = list(PlanningExtractRow.objects.filter(project=project).order_by("id"))
    
    if not rows:
        raise ValueError("No rows found")
    
    current_levels = {}
    
    for row in rows:
        level = row.wbs_level
        
        if level and level > 0:
            # This row is at level X, so update wbs_level_X with its WBS code
            current_levels[level] = row.wbs
            
            # Clear all deeper levels (they no longer apply at this parent context)
            for i in range(level + 1, 11):
                current_levels.pop(i, None)
        
        # Assign all current level values to this row
        for i in range(1, 11):
            setattr(row, f"wbs_level_{i}", current_levels.get(i))
    
    # Bulk update all rows at once
    PlanningExtractRow.objects.bulk_update(
        rows,
        [
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
        ],
        batch_size=1000,
    )
    
    return len(rows)


def _calculate_wbs_level(row, column_map, wbs_raw):
    """
    Calculate WBS level from row data.
    
    Tries to get WBS level from a dedicated column, or calculates it
    from the WBS code structure.
    
    Args:
        row: DataFrame row
        column_map: Case-insensitive column mapping
        wbs_raw: Raw WBS code value
        
    Returns:
        WBS level (int) or None
    """
    wbs_level = None
    wbs_level_key = column_map.get("wbs level") or column_map.get("wbs_level")
    
    if wbs_level_key:
        try:
            wbs_level = int(float(row.get(wbs_level_key)))
        except (ValueError, TypeError):
            wbs_level = None
    
    if wbs_level is None and wbs_raw:
        if "." in wbs_raw:
            wbs_level = len(wbs_raw.split("."))
        else:
            wbs_level = 1
    
    return wbs_level
