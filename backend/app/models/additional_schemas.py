from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List

ALLOWED_AVATAR_IDS = {f"avatar-{i:02d}" for i in range(1, 9)}

MAX_REPORT_EXPORT_ROWS = 1000
MAX_PAYROLL_EXPORT_ROWS = 1000
VALID_REPORT_FORMATS = {"PDF", "XLSX", "CSV", "JSON"}
VALID_REPORT_DATE_RANGES = {
    "Current Month",
    "Current Quarter",
    "Last 30 Days",
    "Year to Date",
    "All Time",
    "Current Week",
}

# --------------------------------------------------------------------------
# Reports Schemas
# --------------------------------------------------------------------------
class ReportFilter(BaseModel):
    department: Optional[str] = "All"
    dateRange: Optional[str] = "Current Month"
    format: Optional[str] = "PDF"
    limit: Optional[int] = Field(default=None, ge=1)

class ReportSummaryResponse(BaseModel):
    reportName: str
    generatedAt: str
    departmentFilter: str
    totalRecords: int
    metrics: Dict[str, Any]
    downloadUrl: str

# --------------------------------------------------------------------------
# Settings Schemas
# --------------------------------------------------------------------------
class SystemSettings(BaseModel):
    companyName: Optional[str] = None
    timeZone: Optional[str] = None
    currency: Optional[str] = None
    biometricSyncEnabled: Optional[bool] = None
    aiModel: Optional[str] = None
    attritionAlertThreshold: Optional[float] = None
    autoApproveLeavesUnderDays: Optional[int] = None
    sessionTimeoutMinutes: Optional[int] = None

# --------------------------------------------------------------------------
# User Profile Schemas
# --------------------------------------------------------------------------
class UserProfile(BaseModel):
    userId: Optional[str] = None
    empId: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    avatarId: Optional[str] = None
    avatar: Optional[str] = None
    mfaEnabled: Optional[bool] = None
    lastLogin: Optional[str] = None

    @field_validator("avatarId")
    @classmethod
    def validate_avatar_id(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = str(value).strip()
        if not cleaned:
            return None
        normalized = cleaned.lower()
        if normalized not in ALLOWED_AVATAR_IDS:
            raise ValueError("avatarId must be one of the approved local avatar IDs.")
        return normalized

    @field_validator("avatar")
    @classmethod
    def validate_avatar_value(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = str(value).strip()
        if not cleaned:
            return None
        normalized = cleaned.lower()
        if normalized in ALLOWED_AVATAR_IDS:
            return normalized
        if normalized.startswith("http://") or normalized.startswith("https://"):
            raise ValueError("External avatar URLs are not allowed. Use avatarId instead.")
        raise ValueError("Avatar must be a valid local avatarId.")
