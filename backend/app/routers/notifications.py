from fastapi import APIRouter, HTTPException, status
from typing import List

from backend.app.models.schemas import (
    NotificationBase,
    NotificationCreate
)
from backend.app.services.workforce_services import NotificationService


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ==========================================================================
# GET Notifications
# ==========================================================================

@router.get(
    "",
    response_model=List[NotificationBase]
)
async def get_notifications():
    """Retrieve system and workforce activity notifications."""

    return await NotificationService.get_all()


# ==========================================================================
# POST Create Notification
# ==========================================================================

@router.post(
    "",
    response_model=NotificationBase,
    status_code=status.HTTP_201_CREATED
)
async def create_notification(
    notification: NotificationCreate
):
    """Create a new system or workforce activity notification."""

    return await NotificationService.create(
        notification
    )


# ==========================================================================
# PUT Mark Notification as Read
# ==========================================================================

@router.put(
    "/{notif_id}/read"
)
async def mark_notification_read(
    notif_id: str
):
    """Mark a specific notification as read."""

    success = await NotificationService.mark_read(
        notif_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification '{notif_id}' not found."
        )

    return {
        "message": f"Notification {notif_id} marked as read"
    }


# ==========================================================================
# POST Mark All Notifications as Read
# ==========================================================================

@router.post(
    "/mark-all-read"
)
async def mark_all_notifications_read():
    """Mark all active notifications as read."""

    await NotificationService.mark_all_read()

    return {
        "message": "All notifications marked as read"
    }