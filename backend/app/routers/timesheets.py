from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from backend.app.models.schemas import TimesheetBase
from backend.app.services.workforce_services import TimesheetService

router = APIRouter(prefix="/timesheets", tags=["Timesheets & Billable Hours"])

@router.get("", response_model=List[TimesheetBase])
async def get_timesheets(
    emp_id: Optional[str] = Query(None, description="Filter by Employee ID")
):
    """Retrieve timesheet entries."""
    return await TimesheetService.get_all(emp_id=emp_id)

@router.post("", response_model=TimesheetBase, status_code=status.HTTP_201_CREATED)
async def submit_timesheet(timesheet: TimesheetBase):
    """Log timesheet hours for project tasks."""
    return await TimesheetService.submit(timesheet)

@router.put("/{timesheet_id}/status", response_model=TimesheetBase)
async def update_timesheet_status(timesheet_id: str, new_status: str = Query(..., description="Approved or Rejected")):
    """Update approval status for timesheet entry."""
    updated = await TimesheetService.update_status(timesheet_id, new_status)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timesheet entry ID '{timesheet_id}' not found."
        )
    return updated
