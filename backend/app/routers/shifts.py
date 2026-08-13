from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional

from backend.app.models.schemas import (
    ShiftRequestBase,
    ShiftRequestResponse,
    ShiftStatusUpdate
)

from backend.app.services.workforce_services import ShiftService


router = APIRouter(
    prefix="/shifts",
    tags=["Shift Scheduling & Swaps"]
)


@router.get(
    "",
    response_model=List[ShiftRequestResponse]
)
async def get_shift_requests(
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by status (Pending, Approved, Rejected)"
    )
):
    """Retrieve shift requests and swap applications."""

    return await ShiftService.get_all(
        status=status_filter
    )


@router.post(
    "",
    response_model=ShiftRequestResponse,
    status_code=status.HTTP_201_CREATED
)
async def submit_shift_request(
    request: ShiftRequestBase
):
    """Submit a shift swap or preference request."""

    try:
        return await ShiftService.submit(request)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


@router.put(
    "/{shift_id}/status",
    response_model=ShiftRequestResponse
)
async def update_shift_status(
    shift_id: str,
    update: ShiftStatusUpdate
):

    updated = await ShiftService.update_status(
        shift_id,
        update
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift request ID '{shift_id}' not found."
        )

    return updated