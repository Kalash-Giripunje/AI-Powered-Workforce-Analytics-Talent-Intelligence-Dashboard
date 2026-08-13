from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional

from backend.app.models.schemas import (
    LeaveRequestBase,
    LeaveStatusUpdate,
    LeaveBalances
)
from backend.app.services.workforce_services import LeaveService
from backend.app.database import get_database


router = APIRouter(
    prefix="/leaves",
    tags=["Leave & Absence Management"]
)


@router.get("", response_model=List[LeaveRequestBase])
async def get_leave_requests(
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by status (Pending, Approved, Rejected)"
    )
):
    """Retrieve leave applications."""
    return await LeaveService.get_all(status=status_filter)


@router.get("/balance", response_model=LeaveBalances)
async def get_leave_balance():
    """Aggregate leave balances from the real MongoDB leaves collection."""

    db = get_database()

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB database is not connected."
        )

    leave_documents = await db.leaves.find(
        {},
        {"_id": 0, "LeaveType": 1, "LeaveBalance": 1}
    ).to_list(length=5000)

    def sum_leave_values(match_strings):
        total = 0
        for doc in leave_documents:
            leave_type = str(doc.get("LeaveType", "")).lower()
            leave_balance = doc.get("LeaveBalance")
            if not isinstance(leave_balance, (int, float)):
                continue
            if any(token in leave_type for token in match_strings):
                total += float(leave_balance)
        return total

    casual_total = sum_leave_values(["casual", "personal"])
    sick_total = sum_leave_values(["sick"])
    earned_total = sum_leave_values(["earned", "annual"])
    parental_total = sum_leave_values(["maternity", "parental"])

    return {
        "casualLeave": {
            "total": int(casual_total),
            "used": 0,
            "remaining": int(casual_total)
        },
        "sickLeave": {
            "total": int(sick_total),
            "used": 0,
            "remaining": int(sick_total)
        },
        "earnedLeave": {
            "total": int(earned_total),
            "used": 0,
            "remaining": int(earned_total)
        },
        "parentalLeave": {
            "total": int(parental_total),
            "used": 0,
            "remaining": int(parental_total)
        }
    }


@router.post(
    "",
    response_model=LeaveRequestBase,
    status_code=status.HTTP_201_CREATED
)
async def submit_leave_request(request: LeaveRequestBase):
    """Submit a new leave request."""
    return await LeaveService.submit(request)


@router.put("/{leave_id}/status", response_model=LeaveRequestBase)
async def update_leave_status(
    leave_id: str,
    update: LeaveStatusUpdate
):
    """Approve or reject leave request."""

    updated = await LeaveService.update_status(
        leave_id,
        update
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave request ID '{leave_id}' not found."
        )

    return updated