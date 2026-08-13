import math
from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from backend.app.models.schemas import AttendanceBase, AttendanceCheckIn, AttendanceCheckOut, PaginatedResponse
from backend.app.services.workforce_services import AttendanceService

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

@router.get("", response_model=PaginatedResponse[AttendanceBase])
async def get_attendance_records(
    department: Optional[str] = Query(None, description="Filter by department"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by attendance status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200)
):
    """Get attendance records with filtering and pagination."""
    items, total = await AttendanceService.get_all(
        department=department,
        status=status_filter,
        page=page,
        size=size
    )
    pages = math.ceil(total / size) if size > 0 else 1
    return PaginatedResponse[AttendanceBase](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/anomalies", response_model=List[AttendanceBase])
async def get_attendance_anomalies():
    """Retrieve flagged attendance anomalies."""
    return await AttendanceService.get_anomalies()

@router.post("/check-in", response_model=AttendanceBase, status_code=status.HTTP_201_CREATED)
async def check_in(payload: AttendanceCheckIn):
    """Manual Check In for employee attendance."""
    try:
        return await AttendanceService.check_in(payload)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

@router.post("/check-out", response_model=AttendanceBase)
async def check_out(payload: AttendanceCheckOut):
    """Manual Check Out for employee attendance and compute working hours."""
    try:
        record = await AttendanceService.check_out(payload)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No active check-in record found to check out for Emp ID '{payload.empId}'."
            )
        return record
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
