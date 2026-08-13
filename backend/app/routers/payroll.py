from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional

from backend.app.database import get_database
from backend.app.models.schemas import PayrollBase
from backend.app.services.workforce_services import PayrollService, normalize_payroll

router = APIRouter(prefix="/payroll", tags=["Payroll & Compensation"])

@router.get("", response_model=List[PayrollBase])
async def get_payroll_records(
    month: Optional[str] = Query(None, description="Filter by pay month (e.g. 2023-05)")
):
    """Retrieve payroll statements from the real MongoDB payroll collection."""
    return await PayrollService.get_all(month=month)

@router.post("/calculate", response_model=List[PayrollBase])
async def calculate_payroll(month: str = Query("2023-05", description="Pay cycle month")):
    """Return the existing payroll records for the requested month without creating synthetic payroll data."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="MongoDB database is not connected.")

    query = {}
    if month:
        query["PayrollMonth"] = {"$regex": f"^{month}$", "$options": "i"}

    items = await db.payroll.find(query, {"_id": 0}).to_list(length=5000)
    return [normalize_payroll(item) for item in items]

@router.put("/{payroll_id}/disburse", response_model=PayrollBase)
async def disburse_payroll(payroll_id: str):
    """Return the matching payroll record without fabricating or mutating source data."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="MongoDB database is not connected.")

    record = await db.payroll.find_one({"_id": payroll_id})
    if not record:
        record = await db.payroll.find_one({"id": payroll_id})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll record ID '{payroll_id}' not found."
        )
    return normalize_payroll(record)
