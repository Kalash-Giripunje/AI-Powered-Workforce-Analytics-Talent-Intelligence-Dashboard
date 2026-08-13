from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from backend.app.models.additional_schemas import (
    ReportFilter,
    ReportSummaryResponse
)
from backend.app.database import get_database


router = APIRouter(
    prefix="/reports",
    tags=["Reports & Workforce Analytics"]
)


@router.post(
    "/generate",
    response_model=ReportSummaryResponse
)
async def generate_report(payload: ReportFilter):
    """Generate workforce summaries using the real MongoDB collections only."""

    db = get_database()

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB database is not connected."
        )

    department_filter = payload.department or "All"
    employee_query = {}
    employee_ids = []

    if department_filter.lower() != "all":
        employee_query["Department"] = {
            "$regex": f"^{department_filter}$",
            "$options": "i"
        }
        employee_cursor = db.employees.find(employee_query, {"_id": 0, "EmpID": 1})
        employee_docs = await employee_cursor.to_list(length=None)
        employee_ids = [doc["EmpID"] for doc in employee_docs if doc.get("EmpID")]

    total_employees = await db.employees.count_documents(employee_query)

    attendance_query = {}
    if employee_ids:
        attendance_query["EmpID"] = {"$in": employee_ids}

    total_attendance = await db.attendance.count_documents(attendance_query)

    present_count = 0
    if total_attendance:
        present_count = await db.attendance.count_documents({
            **attendance_query,
            "AttendanceStatus": {"$in": ["Present", "Late"]}
        })

    attendance_rate = (
        (present_count / total_attendance) * 100
        if total_attendance
        else 0.0
    )

    avg_tenure = 0.0
    if total_employees:
        tenure_pipeline = [
            {"$match": employee_query},
            {"$group": {"_id": None, "avgYears": {"$avg": "$YearsAtCompany"}}}
        ]
        tenure_result = await db.employees.aggregate(tenure_pipeline).to_list(length=1)
        if tenure_result:
            avg_tenure = float(tenure_result[0].get("avgYears", 0.0) or 0.0)

    payroll_query = {}
    if employee_ids:
        payroll_query["EmpID"] = {"$in": employee_ids}

    payroll_records = await db.payroll.find(
        payroll_query,
        {"_id": 0, "NetSalary": 1, "OvertimePay": 1}
    ).to_list(length=None)

    payroll_total = sum(float(record.get("NetSalary", 0) or 0) for record in payroll_records)
    overtime_total = sum(float(record.get("OvertimePay", 0) or 0) for record in payroll_records)

    return ReportSummaryResponse(
        reportName=f"Workforce Summary ({department_filter})",
        generatedAt=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        departmentFilter=department_filter,
        totalRecords=total_employees,
        metrics={
            "avgTenureYears": round(avg_tenure, 2),
            "attendanceRate": f"{attendance_rate:.1f}%",
            "overtimePayTotal": round(overtime_total, 2),
            "payrollCostTotal": round(payroll_total, 2),
            "sourceFields": [
                "employees.YearsAtCompany",
                "attendance.AttendanceStatus",
                "payroll.NetSalary",
                "payroll.OvertimePay"
            ]
        },
        downloadUrl=""
    )


@router.get("/summary")
async def get_report_summary():
    """Return dataset-backed report templates that reflect live MongoDB collections."""

    return [
        {
            "id": "REP-001",
            "title": "Current Workforce Snapshot",
            "category": "Employees",
            "lastGenerated": datetime.now().strftime("%Y-%m-%d"),
            "format": "JSON"
        },
        {
            "id": "REP-002",
            "title": "Attendance Status Summary",
            "category": "Attendance",
            "lastGenerated": datetime.now().strftime("%Y-%m-%d"),
            "format": "JSON"
        },
        {
            "id": "REP-003",
            "title": "Payroll Totals Summary",
            "category": "Payroll",
            "lastGenerated": datetime.now().strftime("%Y-%m-%d"),
            "format": "JSON"
        }
    ]
