from fastapi import APIRouter
from backend.app.models.schemas import DashboardMetrics
from backend.app.services.workforce_services import (
    EmployeeService, LeaveService, ShiftService, PayrollService, AttendanceService, AIPredictionService
)

router = APIRouter(prefix="/analytics", tags=["Executive Analytics & KPIs"])

@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    """Compute dashboard KPIs from the live MongoDB workforce collections."""
    employees, total_emp = await EmployeeService.get_all(size=1000)
    active_emp = sum(1 for e in employees if str(e.get("status", "")).lower() == "active")

    leaves = await LeaveService.get_all()
    pending_leaves = sum(1 for l in leaves if str(l.get("status", "")).lower() == "pending")

    shifts = await ShiftService.get_all()
    pending_shifts = sum(1 for s in shifts if str(s.get("status", "")).lower() == "pending")

    payroll = await PayrollService.get_all()
    total_payroll = sum(float(p.get("netPay", 0.0) or 0.0) for p in payroll)

    attendance_records, _ = await AttendanceService.get_all(page=1, size=10000)
    attendance_total = len(attendance_records)
    present_count = sum(
        1 for record in attendance_records
        if str(record.get("status", "")).lower() == "present"
    )
    attendance_rate = (
        f"{(present_count / attendance_total * 100):.1f}%"
        if attendance_total else "N/A"
    )

    predictions = await AIPredictionService.get_all()
    attrition_risk_count = sum(
        1 for prediction in predictions
        if isinstance(prediction.get("attritionRisk"), (int, float))
        and float(prediction["attritionRisk"]) > 0.7
    )

    return DashboardMetrics(
        totalEmployees=total_emp,
        activeEmployees=active_emp,
        attendanceRate=attendance_rate,
        attritionRiskCount=attrition_risk_count,
        totalMonthlyPayroll=total_payroll,
        pendingLeaveRequests=pending_leaves,
        pendingShiftRequests=pending_shifts
    )
