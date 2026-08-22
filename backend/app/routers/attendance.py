import math
from fastapi import APIRouter, HTTPException, Query, Request, status
from typing import List, Optional
from backend.app.models.schemas import AttendanceBase, AttendanceCheckIn, AttendanceCheckOut, PaginatedResponse
from backend.app.routers.auth import get_authenticated_user, require_employee_self_or_hr, require_hr_admin, get_manager_team_emp_ids
from backend.app.services.workforce_services import AttendanceService

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

@router.get("", response_model=PaginatedResponse[AttendanceBase])
async def get_attendance_records(
    request: Request,
    department: Optional[str] = Query(None, description="Filter by department"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by attendance status"),
    date: Optional[str] = Query(None, description="Date (YYYY-MM-DD). Defaults to today in UTC if omitted"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200)
):
    """Get attendance records with filtering and pagination."""
    auth_user = await require_employee_self_or_hr(request)

    emp_filter = None
    emp_filters = None
    if auth_user.get("role") == "EMPLOYEE":
        emp_filter = auth_user.get("empId")
        if not emp_filter:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee profile could not be loaded.")
    elif auth_user.get("role") == "MANAGER":
        emp_filters = await get_manager_team_emp_ids(auth_user)
        if not emp_filters:
            emp_filters = []

    items, total = await AttendanceService.get_all(
        department=department,
        status=status_filter,
        page=page,
        size=size,
        employee_emp_id=emp_filter,
        employee_emp_ids=emp_filters,
        date=date
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
async def get_attendance_anomalies(request: Request):
    """Retrieve flagged attendance anomalies."""
    await require_hr_admin(request)
    return await AttendanceService.get_anomalies()

@router.post("/check-in", response_model=AttendanceBase, status_code=status.HTTP_201_CREATED)
async def check_in(request: Request, payload: AttendanceCheckIn):
    """Manual Check In for employee attendance."""
    auth_user = await require_employee_self_or_hr(request, emp_id=payload.empId)
    if auth_user.get("role") == "EMPLOYEE" and payload.empId != auth_user.get("empId"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify another employee's attendance record."
        )
    try:
        return await AttendanceService.check_in(payload)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

@router.post("/check-out", response_model=AttendanceBase)
async def check_out(request: Request, payload: AttendanceCheckOut):
    """Manual Check Out for employee attendance and compute working hours."""
    auth_user = await require_employee_self_or_hr(request, emp_id=payload.empId)
    if auth_user.get("role") == "EMPLOYEE" and payload.empId != auth_user.get("empId"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify another employee's attendance record."
        )
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
