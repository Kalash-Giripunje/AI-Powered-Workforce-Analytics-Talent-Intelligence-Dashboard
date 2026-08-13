from fastapi import APIRouter, status
from typing import List

from backend.app.models.schemas import (
    AuditLogBase,
    AuditLogCreate
)

from backend.app.services.workforce_services import (
    AuditService
)


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit & Governance"]
)


@router.get(
    "",
    response_model=List[AuditLogBase]
)
async def get_audit_logs():
    """Retrieve system security and compliance audit logs."""

    return await AuditService.get_all()


@router.post(
    "",
    response_model=AuditLogBase,
    status_code=status.HTTP_201_CREATED
)
async def create_audit_log(
    log: AuditLogCreate
):
    """Log an audit event."""

    return await AuditService.create(log)