from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

# --------------------------------------------------------------------------
# Reports Schemas
# --------------------------------------------------------------------------
class ReportFilter(BaseModel):
    department: Optional[str] = "All"
    dateRange: Optional[str] = "Current Month"
    format: Optional[str] = "PDF"

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
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    avatar: Optional[str] = None
    mfaEnabled: Optional[bool] = None
    lastLogin: Optional[str] = None
