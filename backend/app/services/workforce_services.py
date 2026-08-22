import math
import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone

from backend.app.database import get_database
from backend.app.config import settings
from backend.app.models.schemas import (
    EmployeeCreate,
    EmployeeUpdate,
    AttendanceCheckIn,
    AttendanceCheckOut,
    LeaveRequestBase,
    LeaveStatusUpdate,
    ShiftRequestBase,
    ShiftStatusUpdate,
    TimesheetBase,
    AuditLogBase,
    AuditLogCreate,
    PerformanceBase,
    PerformanceUpdate,
    NotificationCreate,
    AIPredictionBase
)

logger = logging.getLogger("uvicorn.error")


# ==========================================================================
# Document Normalizers
# ==========================================================================

def normalize_employee(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc

    d = dict(doc)

    if "EmpID" in d and "empId" not in d:
        d["empId"] = d["EmpID"]

    if "employeeId" in d and "empId" not in d:
        d["empId"] = d["employeeId"]

    if "EmployeeName" in d:
        full_name = str(d["EmployeeName"]).strip()
        parts = full_name.split()
        if parts:
            d["firstName"] = parts[0]
            d["lastName"] = " ".join(parts[1:]) if len(parts) > 1 else None

    if "Email" in d and "email" not in d:
        d["email"] = d["Email"]

    if "Phone" in d and "phone" not in d:
        d["phone"] = d["Phone"]

    if "Age" in d and "age" not in d:
        d["age"] = d["Age"]

    if "Gender" in d and "gender" not in d:
        d["gender"] = d["Gender"]

    if "Department" in d and "department" not in d:
        d["department"] = d["Department"]

    if "JobRole" in d and "jobRole" not in d:
        d["jobRole"] = d["JobRole"]

    if "JobLevel" in d and "jobLevel" not in d:
        d["jobLevel"] = d["JobLevel"]

    if "ManagerID" in d and "managerId" not in d:
        d["managerId"] = d["ManagerID"]
    if "managerId" in d and "managerEmpId" not in d:
        d["managerEmpId"] = d["managerId"]
    if "ManagerID" in d and "managerEmpId" not in d:
        d["managerEmpId"] = d["ManagerID"]
    if "managerEmpId" in d and "managerId" not in d:
        d["managerId"] = d["managerEmpId"]

    if "Location" in d and "location" not in d:
        d["location"] = d["Location"]

    if "EmploymentStatus" in d and "status" not in d:
        d["status"] = d["EmploymentStatus"]

    if "MonthlyIncome" in d and "monthlyIncome" not in d:
        d["monthlyIncome"] = d["MonthlyIncome"]
    elif "salary" in d and "monthlyIncome" not in d:
        d["monthlyIncome"] = d["salary"]

    if "YearsAtCompany" in d and "yearsAtCompany" not in d:
        d["yearsAtCompany"] = d["YearsAtCompany"]

    if "YearsWithCurrManager" in d and "yearsWithManager" not in d:
        d["yearsWithManager"] = d["YearsWithCurrManager"]

    if "WorkLifeBalance" in d and "workLifeBalanceScore" not in d:
        d["workLifeBalanceScore"] = d["WorkLifeBalance"]

    if "JobSatisfaction" in d and "jobSatisfactionScore" not in d:
        d["jobSatisfactionScore"] = d["JobSatisfaction"]

    if "EnvironmentSatisfaction" in d and "environmentSatisfactionScore" not in d:
        d["environmentSatisfactionScore"] = d["EnvironmentSatisfaction"]

    if "RelationshipSatisfaction" in d and "relationshipSatisfactionScore" not in d:
        d["relationshipSatisfactionScore"] = d["RelationshipSatisfaction"]

    if "Education" in d and "education" not in d:
        d["education"] = str(d["Education"])

    if "EducationField" in d and "educationField" not in d:
        d["educationField"] = d["EducationField"]

    if "Designation" in d and "designation" not in d:
        d["designation"] = d["Designation"]
    elif "JobRole" in d and "designation" not in d:
        d["designation"] = d["JobRole"]

    # Ensure skills is always represented as a list in API responses
    # Convert null -> empty list, and coerce comma-separated strings into lists
    skills_val = d.get("skills", None)
    if skills_val is None:
        d["skills"] = []
    elif isinstance(skills_val, str):
        d["skills"] = [s.strip() for s in skills_val.split(",") if s.strip()]

    return d


def normalize_attendance(
    doc: Dict[str, Any],
    employee: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:

    if not doc:
        return doc

    d = dict(doc)

    if "EmpID" in d and "empId" not in d:
        d["empId"] = d["EmpID"]
    elif "employeeId" in d and "empId" not in d:
        d["empId"] = d["employeeId"]

    if "Date" in d and "date" not in d:
        d["date"] = d["Date"]

    if "CheckIn" in d and "checkIn" not in d:
        d["checkIn"] = d["CheckIn"]

    if "CheckOut" in d and "checkOut" not in d:
        d["checkOut"] = d["CheckOut"]

    if "WorkingHours" in d and "workingHours" not in d:
        d["workingHours"] = d["WorkingHours"]

    if "AttendanceStatus" in d and "status" not in d:
        d["status"] = d["AttendanceStatus"]

    if "LateArrival" in d:
        d["isAnomaly"] = bool(d["LateArrival"])
        d["anomalyReason"] = "Late arrival" if d["LateArrival"] else None

    if "GPSVerified" in d and "gpsVerified" not in d:
        d["gpsVerified"] = d["GPSVerified"]
    if "DistanceFromOffice" in d and "distanceFromOffice" not in d:
        d["distanceFromOffice"] = d["DistanceFromOffice"]
    if "GeofenceStatus" in d and "geofenceStatus" not in d:
        d["geofenceStatus"] = d["GeofenceStatus"]
    if "Latitude" in d and "latitude" not in d:
        d["latitude"] = d["Latitude"]
    if "Longitude" in d and "longitude" not in d:
        d["longitude"] = d["Longitude"]

    if employee:
        first_name = employee.get("firstName")
        last_name = employee.get("lastName")
        full_name = " ".join(part for part in [first_name, last_name] if part)
        if full_name:
            d["empName"] = full_name

        if "department" in employee and employee.get("department") is not None:
            d["department"] = employee["department"]

        if "avatar" in employee and employee.get("avatar") is not None:
            d["avatar"] = employee["avatar"]

    if "id" not in d and "_id" in d:
        d["id"] = str(d["_id"])

    return d


def normalize_leave(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc

    d = dict(doc)

    if "EmpID" in d and "empId" not in d:
        d["empId"] = d["EmpID"]
    elif "employeeId" in d and "empId" not in d:
        d["empId"] = d["employeeId"]

    if "LeaveType" in d and "leaveType" not in d:
        d["leaveType"] = d["LeaveType"]

    if "StartDate" in d and "startDate" not in d:
        d["startDate"] = d["StartDate"]

    if "EndDate" in d and "endDate" not in d:
        d["endDate"] = d["EndDate"]

    if "Status" in d and "status" not in d:
        d["status"] = d["Status"]

    if "LeaveBalance" in d and "leaveBalance" not in d:
        d["leaveBalance"] = d["LeaveBalance"]

    if "days" not in d and d.get("StartDate") and d.get("EndDate"):
        try:
            start = datetime.strptime(d["StartDate"], "%Y-%m-%d")
            end = datetime.strptime(d["EndDate"], "%Y-%m-%d")
            d["days"] = (end - start).days + 1
        except Exception:
            d["days"] = None

    # Prefer RequestID as public id for leaves, otherwise fall back to MongoDB _id if present
    if "id" not in d:
        if d.get("RequestID"):
            d["id"] = str(d.get("RequestID"))
        elif d.get("_id"):
            d["id"] = str(d.get("_id"))

    # Map Reason (DB) -> reason (API)
    if "reason" not in d and d.get("Reason") is not None:
        d["reason"] = d.get("Reason")

    # AppliedOn / AppliedDate -> appliedOn (prefer AppliedOn)
    if "appliedOn" not in d:
        applied_on = d.get("AppliedOn") or d.get("AppliedDate")
        if applied_on:
            d["appliedOn"] = applied_on

    # Expose appliedDate explicitly when present
    if "appliedDate" not in d and d.get("AppliedDate") is not None:
        d["appliedDate"] = d.get("AppliedDate")

    # ManagerComments -> approverComments
    if "approverComments" not in d and d.get("ManagerComments") is not None:
        d["approverComments"] = d.get("ManagerComments")

    return d


def normalize_shift(
    doc: Dict[str, Any],
    employee: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:

    if not doc:
        return doc

    d = dict(doc)

    if "EmpID" in d and "empId" not in d:
        d["empId"] = d["EmpID"]

    if "ShiftName" in d and "shiftName" not in d:
        d["shiftName"] = d["ShiftName"]

    if "ShiftStart" in d and "shiftStart" not in d:
        d["shiftStart"] = d["ShiftStart"]

    if "ShiftEnd" in d and "shiftEnd" not in d:
        d["shiftEnd"] = d["ShiftEnd"]

    if "OvertimeHours" in d and "overtimeHours" not in d:
        d["overtimeHours"] = d["OvertimeHours"]

    if "ShiftDate" in d and "requestedDate" not in d:
        d["requestedDate"] = d["ShiftDate"]
    if "RequestedDate" in d and "requestedDate" not in d:
        d["requestedDate"] = d["RequestedDate"]

    if "status" not in d:
        raw_status = d.get("ShiftSwapStatus")
        if raw_status is not None:
            val = str(raw_status).strip().title()
            if val in ShiftService.VALID_STATUSES:
                d["status"] = val
            else:
                d["status"] = val
        elif "ShiftSwapApproved" in d:
            d["status"] = "Approved" if d["ShiftSwapApproved"] else "Pending"

    reason_aliases = ["Reason", "RequestReason", "ShiftReason", "EmployeeReason", "Comments", "Remarks"]
    for alias in reason_aliases:
        if alias in d and "reason" not in d and d.get(alias) is not None:
            d["reason"] = d[alias]
            break

    if "AppliedOn" in d and "appliedOn" not in d:
        d["appliedOn"] = d["AppliedOn"]

    if "ShiftID" in d and "id" not in d:
        d["id"] = d["ShiftID"]
    if "RequestID" in d and "id" not in d:
        d["id"] = d["RequestID"]

    if "ManagerComments" in d and "approverComments" not in d:
        d["approverComments"] = d["ManagerComments"]
    if "ApproverComments" in d and "approverComments" not in d:
        d["approverComments"] = d["ApproverComments"]

    if "Approver" in d and "approverName" not in d:
        d["approverName"] = d["Approver"]
    if "Manager" in d and "approverName" not in d:
        d["approverName"] = d["Manager"]

    if employee:
        first_name = employee.get("firstName")
        last_name = employee.get("lastName")
        full_name = " ".join(part for part in [first_name, last_name] if part)
        if full_name:
            d["empName"] = full_name
        if "department" in employee and employee.get("department") is not None:
            d["department"] = employee["department"]

    if "requestedShift" not in d and d.get("shiftName"):
        start = d.get("shiftStart", "")
        end = d.get("shiftEnd", "")
        if start or end:
            d["requestedShift"] = f"{d['shiftName']} ({start} - {end})".strip()
        else:
            d["requestedShift"] = d["shiftName"]
    if "RequestedShift" in d and "requestedShift" not in d:
        d["requestedShift"] = d["RequestedShift"]

    return d


def normalize_timesheet(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc

    d = dict(doc)

    if "EmpID" in d and "empId" not in d:
        d["empId"] = d["EmpID"]

    if "Date" in d and "date" not in d:
        d["date"] = d["Date"]

    if "Project" in d and "projectName" not in d:
        d["projectName"] = d["Project"]

    if "HoursWorked" in d and "hoursLogged" not in d:
        d["hoursLogged"] = d["HoursWorked"]

    if "ClientBillingHours" in d and "clientBillingHours" not in d:
        d["clientBillingHours"] = d["ClientBillingHours"]

    if "Status" in d and "status" not in d:
        d["status"] = d["Status"]

    if "isBillable" not in d and "clientBillingHours" in d:
        d["isBillable"] = bool(d["clientBillingHours"] > 0)

    if "id" not in d and "_id" in d:
        d["id"] = str(d["_id"])

    return d


def normalize_payroll(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc

    d = dict(doc)

    if "EmpID" in d and "empId" not in d:
        d["empId"] = d["EmpID"]

    if "BasicSalary" in d and "baseSalary" not in d:
        d["baseSalary"] = d["BasicSalary"]

    if "OvertimePay" in d and "overtimePay" not in d:
        d["overtimePay"] = d["OvertimePay"]

    if "Bonus" in d and "performanceBonus" not in d:
        d["performanceBonus"] = d["Bonus"]

    if "Tax" in d and "taxDeductions" not in d:
        d["taxDeductions"] = d["Tax"]

    if "NetSalary" in d and "netPay" not in d:
        d["netPay"] = d["NetSalary"]

    if "PayrollMonth" in d and "month" not in d:
        d["month"] = d["PayrollMonth"]

    if "grossEarnings" not in d:
        base = float(d.get("baseSalary", 0) or 0)
        overtime = float(d.get("overtimePay", 0) or 0)
        bonus = float(d.get("performanceBonus", 0) or 0)
        d["grossEarnings"] = base + overtime + bonus

    if "incentives" not in d:
        d["incentives"] = None

    if "attendanceDeductions" not in d:
        d["attendanceDeductions"] = None

    if "id" not in d and "_id" in d:
        d["id"] = str(d["_id"])

    return d


def normalize_performance(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc

    d = dict(doc)

    if "EmpID" in d and "empId" not in d:
        d["empId"] = d["EmpID"]

    if "KPI" in d and "performanceScore" not in d:
        d["performanceScore"] = d["KPI"]

    if "GoalCompletion" in d and "kpiCompletionRate" not in d:
        d["kpiCompletionRate"] = d["GoalCompletion"]

    if "ProductivityScore" in d and "productivityScore" not in d:
        d["productivityScore"] = d["ProductivityScore"]

    if "PerformanceRating" in d and "performanceRating" not in d:
        d["performanceRating"] = d["PerformanceRating"]

    if "ReviewDate" in d and "reviewDate" not in d:
        d["reviewDate"] = d["ReviewDate"]

    if "promotionRecommended" not in d and "performanceRating" in d:
        d["promotionRecommended"] = d["performanceRating"] >= 4

    if "id" not in d and "_id" in d:
        d["id"] = str(d["_id"])

    return d


def normalize_notification(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc

    d = dict(doc)

    if "EmpID" in d and "empId" not in d:
        d["empId"] = d["EmpID"]

    if "Type" in d and "type" not in d:
        d["type"] = d["Type"]

    if "Message" in d and "message" not in d:
        d["message"] = d["Message"]

    if "Status" in d and "isRead" not in d:
        d["isRead"] = str(d["Status"]).lower() == "read"

    if "NotificationDate" in d and "timestamp" not in d:
        d["timestamp"] = d["NotificationDate"]

    if "title" not in d and "type" in d:
        d["title"] = d["type"]

    if "priority" not in d:
        d["priority"] = None

    if "id" not in d and "_id" in d:
        d["id"] = str(d["_id"])
        # Avoid leaking the raw MongoDB _id in the API response — normalize to 'id' only
        d.pop("_id", None)

    return d


def normalize_audit_log(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc

    d = dict(doc)

    # Backwards-compat: older audit records may use userId/userRole
    # while newer ones use actor. Synthesize a readable actor string.
    if "userId" in d and "actor" not in d:
        role = d.get("userRole", "User")
        d["actor"] = f"{d['userId']} ({role})"

    # Ensure a stable API-facing id exists and is usable.
    # Accept an explicit 'id' only when it contains a meaningful value
    # (non-null, non-empty string). If the id is missing/None/empty,
    # fall back to the MongoDB _id for stability. After deriving the
    # public id, remove the raw MongoDB _id to avoid leaking internal
    # identifiers. Only generate a random fallback id when neither an
    # explicit id nor a MongoDB _id exists (rare legacy case).

    raw_id = d.get("id") if "id" in d else None
    usable_id = None
    if raw_id is not None:
        # Treat non-empty strings as usable; other falsy values are not usable
        if isinstance(raw_id, str):
            if raw_id.strip() != "":
                usable_id = raw_id.strip()
        else:
            # Non-string but present (e.g., numeric) — convert to string
            usable_id = str(raw_id)

    if usable_id:
        d["id"] = usable_id
        # Remove internal _id if present to avoid leaking it
        d.pop("_id", None)
    else:
        # id missing or null/empty — prefer stable MongoDB _id when available
        if "_id" in d and d.get("_id") is not None:
            d["id"] = str(d["_id"])
            d.pop("_id", None)
        else:
            # Very rare legacy record without any identifier: synthesize a short stable id
            d["id"] = f"AUD-{uuid.uuid4().hex[:6].upper()}"

    return d


async def log_export_audit(
    actor: str,
    action: str,
    scope: str,
    export_format: str,
    record_count: int,
    ip_address: Optional[str] = None,
) -> Dict[str, Any]:
    """Persist a minimal audit record for exports without storing any payroll contents."""
    from backend.app.models.schemas import AuditLogCreate

    audit_action = (
        f"{action} scope={scope} format={export_format} count={record_count}"
    )
    log = AuditLogCreate(
        actor=actor,
        action=audit_action,
        module="Exports",
        ipAddress=ip_address or "unknown",
        status="SUCCESS",
    )
    return await AuditService.create(log)


def normalize_ai_prediction(    doc: Dict[str, Any]
) -> Dict[str, Any]:

    if not doc:
        return doc

    d = dict(doc)

    # ---------------------------------------------------------
    # Employee ID
    # ---------------------------------------------------------

    if "EmpID" in d:
        d["empId"] = d["EmpID"]

    elif "employeeId" in d and "empId" not in d:
        d["empId"] = d["employeeId"]

    # ---------------------------------------------------------
    # AI Prediction fields
    # ---------------------------------------------------------

    if "AttritionRisk" in d:
        d["attritionRisk"] = d["AttritionRisk"]

    if "SkillGapScore" in d:
        d["skillGapScore"] = d["SkillGapScore"]

    if "WorkforceHealthScore" in d:
        d["workforceHealthScore"] = (
            d["WorkforceHealthScore"]
        )

    if "Recommendation" in d:
        d["recommendation"] = d["Recommendation"]

    if "PredictionDate" in d:
        d["predictionDate"] = d["PredictionDate"]

    # ---------------------------------------------------------
    # Stable API ID
    # ---------------------------------------------------------

    if "id" not in d:

        if "_id" in d:
            d["id"] = str(d["_id"])

        else:
            d["id"] = (
                f"AI-{d.get('empId', 'UNKNOWN')}-"
                f"{d.get('predictionDate', 'UNKNOWN')}"
            )

    return d


# ==========================================================================
# 1. Employee Service
# ==========================================================================

class MissingEmployeeCounterError(RuntimeError):
    """Raised when the counters.employee_id document is missing.

    This is a specific subclass so callers can distinguish an uninitialized
    employee counter from other RuntimeError conditions (like DB connection).
    """


class EmployeeService:
    @staticmethod
    async def count_total() -> int:
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB database is not connected.")
        return await db.employees.count_documents({})

    @staticmethod
    async def count_active() -> int:
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB database is not connected.")
        return await db.employees.count_documents({"EmploymentStatus": {"$regex": r"^active$", "$options": "i"}})


    # MongoDB field names -> API field names
    SORT_FIELD_MAP = {
        "empId": "EmpID",
        "firstName": "EmployeeName",
        "lastName": "EmployeeName",
        "department": "Department",
        "jobRole": "JobRole",
        "monthlyIncome": "MonthlyIncome",
        "status": "EmploymentStatus",
        "age": "Age",
        "jobLevel": "JobLevel",
        "location": "Location",
        "yearsAtCompany": "YearsAtCompany"
    }

    # API field names -> MongoDB field names
    FIELD_MAP = {
        "empId": "EmpID",
        "email": "Email",
        "phone": "Phone",
        "age": "Age",
        "gender": "Gender",
        "department": "Department",
        "jobRole": "JobRole",
        "education": "Education",
        "educationField": "EducationField",
        "monthlyIncome": "MonthlyIncome",
        "jobLevel": "JobLevel",
        "yearsAtCompany": "YearsAtCompany",
        "workLifeBalanceScore": "WorkLifeBalance",
        "jobSatisfactionScore": "JobSatisfaction",
        "environmentSatisfactionScore": "EnvironmentSatisfaction",
        "relationshipSatisfactionScore": "RelationshipSatisfaction",
        "yearsWithManager": "YearsWithCurrManager",
        "status": "EmploymentStatus",
        "managerId": "ManagerID",
        "location": "Location"
    }

    # ----------------------------------------------------------------------
    # GET ALL EMPLOYEES
    # ----------------------------------------------------------------------

    @staticmethod
    async def get_all(
        department: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "empId",
        sort_order: str = "asc",
        page: int = 1,
        size: int = 50,
        emp_id: Optional[str] = None,
        emp_ids: Optional[List[str]] = None
    ) -> Tuple[List[Dict[str, Any]], int]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Build MongoDB query
        # ---------------------------------------------------------

        query: Dict[str, Any] = {}

        # ---------------------------------------------------------
        # Department filter
        # ---------------------------------------------------------

        if department and department.lower() != "all":
            query["Department"] = {
                "$regex": f"^{department}$",
                "$options": "i"
            }

        # ---------------------------------------------------------
        # Employment status filter
        # ---------------------------------------------------------

        if status and status.lower() != "all":
            query["EmploymentStatus"] = {
                "$regex": f"^{status}$",
                "$options": "i"
            }

        if emp_ids:
            query["EmpID"] = {"$in": [str(item).strip() for item in emp_ids if str(item).strip()]}
        elif emp_id and str(emp_id).strip():
            query["EmpID"] = str(emp_id).strip()

        # ---------------------------------------------------------
        # Search
        # ---------------------------------------------------------

        if search:
            query["$or"] = [
                {
                    "EmpID": {
                        "$regex": search,
                        "$options": "i"
                    }
                },
                {
                    "EmployeeName": {
                        "$regex": search,
                        "$options": "i"
                    }
                },
                {
                    "Email": {
                        "$regex": search,
                        "$options": "i"
                    }
                },
                {
                    "Department": {
                        "$regex": search,
                        "$options": "i"
                    }
                },
                {
                    "JobRole": {
                        "$regex": search,
                        "$options": "i"
                    }
                },
                {
                    "Location": {
                        "$regex": search,
                        "$options": "i"
                    }
                }
            ]

        # ---------------------------------------------------------
        # Count matching employees
        # ---------------------------------------------------------

        total = await db.employees.count_documents(
            query
        )

        # ---------------------------------------------------------
        # Sorting
        # ---------------------------------------------------------

        order_val = (
            1
            if sort_order.lower() == "asc"
            else -1
        )

        mongo_sort_field = EmployeeService.SORT_FIELD_MAP.get(
            sort_by,
            "EmpID"
        )

        # ---------------------------------------------------------
        # Pagination
        # ---------------------------------------------------------

        skip = (page - 1) * size

        cursor = (
            db.employees
            .find(
                query,
                {"_id": 0}
            )
            .sort(
                mongo_sort_field,
                order_val
            )
            .skip(skip)
            .limit(size)
        )

        items = await cursor.to_list(
            length=size
        )

        # ---------------------------------------------------------
        # Normalize MongoDB documents -> API format
        # ---------------------------------------------------------

        normalized_items = [
            normalize_employee(item)
            for item in items
        ]

        # ---------------------------------------------------------
        # Batch enrichment: performance, AI predictions, payroll
        # Use a single batched query per related collection to avoid N+1
        # ---------------------------------------------------------
        emp_ids = [e.get('empId') for e in normalized_items if e.get('empId')]
        if emp_ids:
            try:
                # Performance documents for these employees
                perf_docs = await db.performance.find({"EmpID": {"$in": emp_ids}}, {"_id": 0}).to_list(length=len(emp_ids))
                perf_raw_map = {d.get('EmpID'): d for d in perf_docs if d and d.get('EmpID')}
                perf_norm_map = {normalize_performance(d).get('empId'): normalize_performance(d) for d in perf_docs if d}

                # AI prediction documents
                ai_docs = await db.ai_predictions.find({"EmpID": {"$in": emp_ids}}, {"_id": 0}).to_list(length=len(emp_ids))
                ai_norm_map = {normalize_ai_prediction(d).get('empId'): normalize_ai_prediction(d) for d in ai_docs if d}

                # Payroll documents: fetch recent entries and pick the latest per employee
                payroll_docs = await db.payroll.find({"EmpID": {"$in": emp_ids}}, {"_id": 0}).to_list(length=max(50, len(emp_ids)*3))
                payroll_map = {}
                for doc in payroll_docs:
                    if not doc:
                        continue
                    empid = doc.get('EmpID')
                    norm = normalize_payroll(doc)
                    if empid in payroll_map:
                        # choose latest by month string (expects YYYY-MM or lexicographically comparable)
                        existing_month = payroll_map[empid].get('month') or ''
                        this_month = norm.get('month') or ''
                        if this_month and this_month > existing_month:
                            payroll_map[empid] = norm
                    else:
                        payroll_map[empid] = norm

                # Merge normalized related fields into employee responses
                for emp in normalized_items:
                    eid = emp.get('empId')
                    if not eid:
                        continue

                    # Performance
                    pnorm = perf_norm_map.get(eid)
                    praw = perf_raw_map.get(eid)
                    if pnorm:
                        for key in [
                            'performanceScore',
                            'productivityScore',
                            'kpiCompletionRate',
                            'performanceRating',
                            'reviewDate'
                        ]:
                            if key in pnorm:
                                emp[key] = pnorm.get(key)

                        # goalsCompleted/totalGoals come from raw document fields when present
                        if praw and praw.get('GoalCompletion') is not None:
                            emp['goalsCompleted'] = praw.get('GoalCompletion')
                        if praw and praw.get('TotalGoals') is not None:
                            emp['totalGoals'] = praw.get('TotalGoals')
                        else:
                            emp.setdefault('totalGoals', None)

                        if 'promotionRecommended' in pnorm:
                            emp['promotionRecommended'] = pnorm.get('promotionRecommended')

                    # AI prediction
                    a = ai_norm_map.get(eid)
                    if a:
                        if a.get('recommendation'):
                            emp['aiFeedback'] = a.get('recommendation')
                        if a.get('attritionRisk') is not None:
                            emp['attritionRisk'] = a.get('attritionRisk')

                    # Payroll (latest)
                    pay = payroll_map.get(eid)
                    if pay:
                        if 'month' in pay:
                            emp['lastPayrollMonth'] = pay.get('month')
                        if 'netPay' in pay:
                            emp['lastNetPay'] = pay.get('netPay')

            except Exception as _e:
                logger.warning(f"Failed to batch-enrich employees: {_e}")

        return normalized_items, total

    # ----------------------------------------------------------------------
    # GET EMPLOYEE BY ID
    # ----------------------------------------------------------------------

    @staticmethod
    async def get_by_id(
        emp_id: str
    ) -> Optional[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        emp = await db.employees.find_one(
            {
                "EmpID": emp_id
            },
            {"_id": 0}
        )

        if emp:
            return normalize_employee(emp)

        return None

    # ----------------------------------------------------------------------
    # CREATE EMPLOYEE
    # ----------------------------------------------------------------------

    @staticmethod
    async def create(
        data: EmployeeCreate
    ) -> Dict[str, Any]:

        from pymongo.errors import DuplicateKeyError

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Determine EmpID: use client-supplied if present, else
        # generate server-side using counters.employee_id.
        # Note: upsert is intentionally False to avoid creating
        # the counter document automatically. The deployment
        # operator should initialize counters.employee_id to
        # the current max (e.g., seq=10000) before enabling generation.
        # ---------------------------------------------------------

        emp_id = getattr(data, 'empId', None)

        if not emp_id:
            # Attempt to atomically get the next sequence without upsert
            from pymongo import ReturnDocument

            counter = await db.counters.find_one_and_update(
                {"_id": "employee_id"},
                {"$inc": {"seq": 1}},
                upsert=False,
                return_document=ReturnDocument.AFTER
            )

            if not counter or 'seq' not in counter:
                # Raise a specific exception so the router can return 503
                raise MissingEmployeeCounterError(
                    "Employee ID counter is not initialized. "
                    "Please initialize counters.employee_id with the current sequence before enabling server-side EmpID generation."
                )

            sequence = counter['seq']
            emp_id = f"EMP{sequence:06d}"

        # ---------------------------------------------------------
        # Convert API format -> MongoDB format
        # ---------------------------------------------------------

        doc = {
            "EmpID": emp_id,
            "EmployeeName": (
                f"{data.firstName} {data.lastName}"
            ).strip(),
            "Email": str(data.email) if data.email is not None else None,
            "Phone": data.phone,
            "Age": data.age,
            "Gender": data.gender,
            "Department": data.department,
            "JobRole": data.jobRole,
            "Education": data.education,
            "EducationField": data.educationField,
            "MonthlyIncome": data.monthlyIncome,
            "JobLevel": data.jobLevel,
            "ManagerID": data.managerId,
            "Location": data.location,
            "EmploymentStatus": data.status,
            "YearsAtCompany": data.yearsAtCompany,
            "YearsWithCurrManager": data.yearsWithManager,
            "WorkLifeBalance": data.workLifeBalanceScore,
            "JobSatisfaction": data.jobSatisfactionScore,
            "EnvironmentSatisfaction": (
                data.environmentSatisfactionScore
            ),
            "RelationshipSatisfaction": (
                data.relationshipSatisfactionScore
            ),
            "EmploymentType": "Full-Time",
            "Role": "Employee",
            "Attrition": "No",
            "JoiningDate": "",
            "ExitDate": "N/A"
        }

        # ---------------------------------------------------------
        # Insert into MongoDB with explicit DuplicateKeyError handling
        # ---------------------------------------------------------
        try:
            await db.employees.insert_one(doc)
        except DuplicateKeyError as exc:
            # Do not overwrite existing employees; surface a clear error
            raise ValueError(f"Employee ID '{emp_id}' already exists.") from exc

        # ---------------------------------------------------------
        # Return API format
        # ---------------------------------------------------------

        return normalize_employee(
            doc
        )

    # ----------------------------------------------------------------------
    # UPDATE EMPLOYEE
    # ----------------------------------------------------------------------

    @staticmethod
    async def update(
        emp_id: str,
        data: EmployeeUpdate
    ) -> Optional[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Get API fields supplied by client
        # ---------------------------------------------------------

        incoming = {
            key: value
            for key, value in data.model_dump().items()
            if value is not None
        }

        if not incoming:
            return await EmployeeService.get_by_id(
                emp_id
            )

        # ---------------------------------------------------------
        # Convert API field names -> MongoDB field names
        # ---------------------------------------------------------

        update_fields: Dict[str, Any] = {}

        for api_field, value in incoming.items():

            mongo_field = EmployeeService.FIELD_MAP.get(
                api_field
            )

            if mongo_field:
                update_fields[mongo_field] = value

        # ---------------------------------------------------------
        # Handle firstName / lastName
        #
        # MongoDB stores complete name in EmployeeName.
        # ---------------------------------------------------------

        if (
            "firstName" in incoming
            or "lastName" in incoming
        ):

            existing = await db.employees.find_one(
                {
                    "EmpID": emp_id
                },
                {
                    "_id": 0,
                    "EmployeeName": 1
                }
            )

            if not existing:
                return None

            current_name = existing.get(
                "EmployeeName",
                ""
            )

            name_parts = current_name.split(
                " ",
                1
            )

            current_first_name = (
                name_parts[0]
                if name_parts
                else ""
            )

            current_last_name = (
                name_parts[1]
                if len(name_parts) > 1
                else ""
            )

            first_name = incoming.get(
                "firstName",
                current_first_name
            )

            last_name = incoming.get(
                "lastName",
                current_last_name
            )

            update_fields["EmployeeName"] = (
                f"{first_name} {last_name}"
            ).strip()

        # ---------------------------------------------------------
        # Employee ID must not be changed
        # ---------------------------------------------------------

        update_fields.pop(
            "EmpID",
            None
        )

        # ---------------------------------------------------------
        # Nothing to update
        # ---------------------------------------------------------

        if not update_fields:
            return await EmployeeService.get_by_id(
                emp_id
            )

        # ---------------------------------------------------------
        # Perform MongoDB update
        # ---------------------------------------------------------

        result = await db.employees.find_one_and_update(
            {
                "EmpID": emp_id
            },
            {
                "$set": update_fields
            },
            return_document=True,
            projection={
                "_id": 0
            }
        )

        if result:
            return normalize_employee(
                result
            )

        return None

    # ----------------------------------------------------------------------
    # DELETE EMPLOYEE
    # ----------------------------------------------------------------------

    @staticmethod
    async def delete(
        emp_id: str
    ) -> bool:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        result = await db.employees.delete_one(
            {
                "EmpID": emp_id
            }
        )

        return result.deleted_count > 0


# ==========================================================================
# 2. Attendance Service
# ==========================================================================

class AttendanceService:
    @staticmethod
    async def count_total_and_present() -> (int, int):
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB database is not connected.")
        total = await db.attendance.count_documents({})
        present = await db.attendance.count_documents({"AttendanceStatus": {"$regex": r"^present$", "$options": "i"}})
        return total, present


    @staticmethod
    async def get_all(
        department: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 50,
        employee_emp_id: Optional[str] = None,
        employee_emp_ids: Optional[List[str]] = None,
        date: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Build employee query (we page employees, then merge attendance)
        # ---------------------------------------------------------
        employee_query: Dict[str, Any] = {}

        # If employee_emp_id or employee_emp_ids is provided, restrict results to those employee records
        if employee_emp_ids:
            employee_query["EmpID"] = {"$in": [str(item).strip() for item in employee_emp_ids if str(item).strip()]}
        elif employee_emp_id:
            employee_query["EmpID"] = employee_emp_id

        # Department filter applies to employee collection
        if department and department.lower() != "all":
            employee_query["Department"] = {
                "$regex": f"^{department}$",
                "$options": "i"
            }

        # ---------------------------------------------------------
        # Total employees matching the employee-level filters
        # ---------------------------------------------------------
        total_employees = await db.employees.count_documents(employee_query)

        # Pagination for employee page
        skip = (page - 1) * size

        employee_cursor = db.employees.find(
            employee_query,
            {"_id": 0}
        ).skip(skip).limit(size)

        employee_docs = await employee_cursor.to_list(length=size)

        # No employees on this page
        if not employee_docs:
            return [], total_employees

        # Build normalized employee lookup for enrichment
        employee_lookup: Dict[str, Dict[str, Any]] = {}
        emp_ids: List[str] = []
        for emp in employee_docs:
            emp_id = emp.get("EmpID")
            if emp_id:
                employee_lookup[emp_id] = normalize_employee(emp)
                emp_ids.append(emp_id)

        # ---------------------------------------------------------
        # Fetch attendance records for this employee page and requested date
        # ---------------------------------------------------------
        attendance_query: Dict[str, Any] = {"EmpID": {"$in": emp_ids}}

        if date:
            attendance_query["Date"] = date

        # For non-Absence status filters, constrain attendance query to reduce data
        if status and status.lower() != "all":
            if status.lower() != "absent":
                attendance_query["AttendanceStatus"] = {
                    "$regex": f"^{status}$",
                    "$options": "i"
                }
            # If status == 'absent', do not add AttendanceStatus filter because absence is lack of attendance record

        cursor = db.attendance.find(attendance_query, {"_id": 0})
        attendance_documents = await cursor.to_list(length=None)

        attendance_lookup: Dict[str, Dict[str, Any]] = {}
        for a in attendance_documents:
            aid = a.get("EmpID")
            if aid:
                attendance_lookup[aid] = a

        # ---------------------------------------------------------
        # Merge: for each employee in requested page, produce an attendance-like record
        # ---------------------------------------------------------
        merged_items: List[Dict[str, Any]] = []

        # Determine default date string for absent synthetic entries
        if date:
            target_date = date
        else:
            # use UTC date string to be consistent with service conventions
            target_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        for emp in employee_docs:
            eid = emp.get("EmpID")
            emp_norm = employee_lookup.get(eid)
            att_doc = attendance_lookup.get(eid)
            if att_doc:
                merged_items.append(normalize_attendance(att_doc, emp_norm))
            else:
                # Synthesize a read-only absent representation (do not persist to DB)
                synthetic = {
                    "EmpID": eid,
                    "Date": target_date,
                    "CheckIn": None,
                    "CheckOut": None,
                    "WorkingHours": 0,
                    "AttendanceStatus": "Absent",
                }
                merged_items.append(normalize_attendance(synthetic, emp_norm))

        # ---------------------------------------------------------
        # Apply status filter on merged items (if requested)
        # ---------------------------------------------------------
        if status and status.lower() != "all":
            filtered = []
            for item in merged_items:
                item_status = (item.get("status") or item.get("AttendanceStatus") or "").strip()
                if item_status.lower() == status.lower():
                    filtered.append(item)
            merged_items = filtered

        return merged_items, total_employees

    # ----------------------------------------------------------------------
    # GET ATTENDANCE ANOMALIES
    # ----------------------------------------------------------------------

    @staticmethod
    async def get_anomalies() -> List[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Dataset uses LateArrival = True for attendance anomalies
        # ---------------------------------------------------------

        cursor = db.attendance.find(
            {
                "LateArrival": True
            },
            {
                "_id": 0
            }
        )

        items = await cursor.to_list(
            length=100
        )

        employee_ids = {
            item.get("EmpID")
            for item in items
            if item.get("EmpID")
        }

        employee_lookup: Dict[str, Dict[str, Any]] = {}
        if employee_ids:
            employee_cursor = db.employees.find(
                {"EmpID": {"$in": list(employee_ids)}},
                {"_id": 0}
            )
            employee_documents = await employee_cursor.to_list(length=None)
            for employee_document in employee_documents:
                employee_id = employee_document.get("EmpID")
                if employee_id:
                    employee_lookup[employee_id] = normalize_employee(employee_document)

        normalized_items = []

        for item in items:
            emp_id = item.get("EmpID")
            normalized_items.append(
                normalize_attendance(
                    item,
                    employee_lookup.get(emp_id)
                )
            )

        return normalized_items

    # ----------------------------------------------------------------------
    # CHECK IN
    # ----------------------------------------------------------------------

    @staticmethod
    def _is_late_checkin(time_value: Optional[str]) -> bool:
        if not time_value:
            return False

        raw_value = str(time_value).strip()
        if raw_value in {"", "N/A", "--:--", "None", "null"}:
            return False

        try:
            if "T" in raw_value or raw_value.endswith("Z"):
                parsed = datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
                actual_time = parsed.time()
            else:
                if ":" in raw_value:
                    parts = raw_value.split(":")
                    if len(parts) == 2:
                        actual_time = datetime.strptime(raw_value, "%H:%M").time()
                    else:
                        actual_time = datetime.strptime(raw_value, "%H:%M:%S").time()
                else:
                    return False

            threshold = datetime.strptime("09:15", "%H:%M").time()
            return actual_time > threshold
        except (TypeError, ValueError):
            return False

    @staticmethod
    def _calculate_gps_distance_meters(latitude_a: float, longitude_a: float, latitude_b: float, longitude_b: float) -> float:
        radius_km = 6371.0
        lat_a = math.radians(latitude_a)
        lon_a = math.radians(longitude_a)
        lat_b = math.radians(latitude_b)
        lon_b = math.radians(longitude_b)

        delta_lat = lat_b - lat_a
        delta_lon = lon_b - lon_a
        a = (
            math.sin(delta_lat / 2) ** 2
            + math.cos(lat_a) * math.cos(lat_b) * math.sin(delta_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return radius_km * c * 1000.0

    @staticmethod
    def _resolve_office_geofence() -> Tuple[float, float, float]:
        office_latitude = float(getattr(settings, "OFFICE_LATITUDE", 0.0) or 0.0)
        office_longitude = float(getattr(settings, "OFFICE_LONGITUDE", 0.0) or 0.0)
        radius_meters = float(getattr(settings, "OFFICE_GEOFENCE_RADIUS_METERS", 200.0) or 200.0)
        return office_latitude, office_longitude, radius_meters

    @staticmethod
    def _verify_gps_payload(latitude: Optional[float], longitude: Optional[float], *, require_location: bool) -> Dict[str, Any]:
        if latitude is None or longitude is None:
            if require_location:
                raise ValueError("Location permission is required to check in.")
            return {
                "gpsVerified": None,
                "distanceFromOffice": None,
                "geofenceStatus": None,
                "latitude": None,
                "longitude": None,
            }

        try:
            lat_value = float(latitude)
            lon_value = float(longitude)
        except (TypeError, ValueError) as exc:
            raise ValueError("Invalid latitude or longitude provided.") from exc

        if not (-90 <= lat_value <= 90):
            raise ValueError("Latitude must be between -90 and 90 degrees.")
        if not (-180 <= lon_value <= 180):
            raise ValueError("Longitude must be between -180 and 180 degrees.")

        office_latitude, office_longitude, radius_meters = AttendanceService._resolve_office_geofence()
        distance = AttendanceService._calculate_gps_distance_meters(
            lat_value,
            lon_value,
            office_latitude,
            office_longitude,
        )

        gps_verified = distance <= max(radius_meters, 0.0)
        status = "INSIDE" if gps_verified else "OUTSIDE"
        return {
            "gpsVerified": gps_verified,
            "distanceFromOffice": round(distance, 2),
            "geofenceStatus": status,
            "latitude": lat_value,
            "longitude": lon_value,
        }

    @staticmethod
    async def check_in(
        payload: AttendanceCheckIn
    ) -> Dict[str, Any]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        if not payload.empId or not str(payload.empId).strip():
            raise ValueError("Invalid employee ID.")

        employee = await EmployeeService.get_by_id(
            payload.empId
        )

        if not employee:
            raise ValueError(
                f"Employee '{payload.empId}' was not found."
            )

        now = datetime.now()
        today_str = now.strftime("%Y-%m-%d")

        raw_check_in = payload.checkInTime or now.strftime("%H:%M")
        raw_check_in = str(raw_check_in).strip()

        try:
            if "T" in raw_check_in or raw_check_in.endswith("Z"):
                check_in_dt = datetime.fromisoformat(raw_check_in.replace("Z", "+00:00"))
                time_str = check_in_dt.strftime("%H:%M")
            elif ":" in raw_check_in:
                if len(raw_check_in.split(":")) == 2:
                    time_str = datetime.strptime(raw_check_in, "%H:%M").strftime("%H:%M")
                else:
                    time_str = datetime.strptime(raw_check_in, "%H:%M:%S").strftime("%H:%M")
            else:
                raise ValueError("invalid check-in time format")
        except ValueError as exc:
            raise ValueError("Invalid check-in time supplied.") from exc

        gps_info = AttendanceService._verify_gps_payload(
            payload.latitude,
            payload.longitude,
            require_location=True,
        )
        if not gps_info["gpsVerified"]:
            raise ValueError("You are outside the permitted attendance area.")

        existing = await db.attendance.find_one(
            {
                "EmpID": payload.empId,
                "Date": today_str
            }
        )

        if existing:
            current_check_in = existing.get("CheckIn")
            if current_check_in not in (None, "", "N/A", "--:--"):
                raise ValueError(
                    f"Employee '{payload.empId}' has already checked in today."
                )

            late_arrival = AttendanceService._is_late_checkin(time_str)
            update_payload = {
                "CheckIn": time_str,
                "AttendanceStatus": "Late" if late_arrival else "Present",
                "LateArrival": late_arrival,
                "CheckOut": None,
                "WorkingHours": 0.0,
                "GPSVerified": True,
                "Latitude": gps_info["latitude"],
                "Longitude": gps_info["longitude"],
                "DistanceFromOffice": gps_info["distanceFromOffice"],
                "GeofenceStatus": gps_info["geofenceStatus"],
            }
            await db.attendance.update_one(
                {"_id": existing["_id"]},
                {"$set": update_payload}
            )
            merged_record = {**existing, **update_payload}
            return normalize_attendance(merged_record, employee)

        late_arrival = AttendanceService._is_late_checkin(time_str)
        record = {
            "EmpID": payload.empId,
            "Date": today_str,
            "CheckIn": time_str,
            "CheckOut": None,
            "WorkingHours": 0.0,
            "AttendanceStatus": "Late" if late_arrival else "Present",
            "LateArrival": late_arrival,
            "GPSVerified": True,
            "Latitude": gps_info["latitude"],
            "Longitude": gps_info["longitude"],
            "DistanceFromOffice": gps_info["distanceFromOffice"],
            "GeofenceStatus": gps_info["geofenceStatus"],
        }

        await db.attendance.insert_one(record)
        return normalize_attendance(record, employee)

    # ----------------------------------------------------------------------
    # CHECK OUT
    # ----------------------------------------------------------------------

    @staticmethod
    async def check_out(
        payload: AttendanceCheckOut
    ) -> Optional[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        if not payload.empId or not str(payload.empId).strip():
            raise ValueError("Invalid employee ID.")

        employee = await EmployeeService.get_by_id(
            payload.empId
        )

        if not employee:
            raise ValueError(
                f"Employee '{payload.empId}' was not found."
            )

        now = datetime.now()
        today_str = now.strftime("%Y-%m-%d")

        raw_check_out = payload.checkOutTime or now.strftime("%H:%M")
        raw_check_out = str(raw_check_out).strip()

        try:
            if "T" in raw_check_out or raw_check_out.endswith("Z"):
                check_out_dt = datetime.fromisoformat(raw_check_out.replace("Z", "+00:00"))
                time_str = check_out_dt.strftime("%H:%M")
            elif ":" in raw_check_out:
                if len(raw_check_out.split(":")) == 2:
                    time_str = datetime.strptime(raw_check_out, "%H:%M").strftime("%H:%M")
                else:
                    time_str = datetime.strptime(raw_check_out, "%H:%M:%S").strftime("%H:%M")
            else:
                raise ValueError("invalid check-out time format")
        except ValueError as exc:
            raise ValueError("Invalid check-out time supplied.") from exc

        record = await db.attendance.find_one(
            {
                "EmpID": payload.empId,
                "Date": today_str
            }
        )

        if not record:
            raise ValueError(
                "Attendance record not found for today. Employee must check in before checking out."
            )

        if record.get("CheckIn") in (None, "", "N/A", "--:--"):
            raise ValueError(
                "Employee has not checked in today."
            )

        current_check_out = record.get("CheckOut")
        if current_check_out not in (None, "", "N/A", "--:--"):
            raise ValueError(
                "Employee has already checked out today."
            )

        in_time_value = record.get("CheckIn")
        in_dt = None
        out_dt = None

        try:
            in_dt = datetime.strptime(str(in_time_value), "%H:%M")
            out_dt = datetime.strptime(time_str, "%H:%M")
        except ValueError as exc:
            raise ValueError("Invalid check-in/check-out time found in attendance record.") from exc

        if out_dt <= in_dt:
            raise ValueError("Check-out time must be later than check-in time.")

        working_hours = round((out_dt - in_dt).total_seconds() / 3600.0, 2)
        late_arrival = AttendanceService._is_late_checkin(in_time_value)
        attendance_status = "Late" if late_arrival else "Present"

        gps_update = {}
        if payload.latitude is not None or payload.longitude is not None:
            gps_info = AttendanceService._verify_gps_payload(
                payload.latitude,
                payload.longitude,
                require_location=False,
            )
            if gps_info["gpsVerified"] is False:
                gps_update["GPSVerified"] = False
                gps_update["GeofenceStatus"] = "OUTSIDE"
                gps_update["DistanceFromOffice"] = gps_info["distanceFromOffice"]
                gps_update["Latitude"] = gps_info["latitude"]
                gps_update["Longitude"] = gps_info["longitude"]
            elif gps_info["gpsVerified"] is True:
                gps_update["GPSVerified"] = True
                gps_update["GeofenceStatus"] = "INSIDE"
                gps_update["DistanceFromOffice"] = gps_info["distanceFromOffice"]
                gps_update["Latitude"] = gps_info["latitude"]
                gps_update["Longitude"] = gps_info["longitude"]

        update_payload = {
            "CheckOut": time_str,
            "WorkingHours": working_hours,
            "AttendanceStatus": attendance_status,
            "LateArrival": late_arrival,
            **gps_update,
        }

        updated_record = await db.attendance.find_one_and_update(
            {
                "_id": record["_id"]
            },
            {
                "$set": update_payload
            },
            return_document=True,
            projection={
                "_id": 0
            }
        )

        if updated_record:
            return normalize_attendance(updated_record, employee)

        return None


# ==========================================================================
# 3. Leave Service
# ==========================================================================

class LeaveService:

    VALID_STATUSES = {"Pending", "Approved", "Rejected"}

    @staticmethod
    def _normalize_status(raw_status: Optional[str]) -> str:
        if raw_status is None:
            return "Pending"
        value = str(raw_status).strip()
        if not value:
            return "Pending"
        normalized = value.title()
        if normalized not in LeaveService.VALID_STATUSES:
            raise ValueError("Leave status must be one of: Pending, Approved, Rejected.")
        return normalized

    @staticmethod
    async def _has_overlapping_leave(
        emp_id: str,
        start_date: str,
        end_date: str,
        exclude_leave_id: Optional[str] = None
    ) -> bool:
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB database is not connected.")

        try:
            start = datetime.strptime(str(start_date), "%Y-%m-%d")
            end = datetime.strptime(str(end_date), "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("Invalid leave date provided.") from exc

        if end < start:
            raise ValueError("Leave end date cannot be earlier than the start date.")

        query: Dict[str, Any] = {"EmpID": emp_id}
        if exclude_leave_id:
            try:
                from bson import ObjectId
                query["_id"] = {"$ne": ObjectId(exclude_leave_id)}
            except Exception:
                query["id"] = {"$ne": exclude_leave_id}

        items = await db.leaves.find(query, {"_id": 0}).to_list(length=5000)
        for item in items:
            existing_status = str(item.get("Status") or "").strip()
            if existing_status.lower() == "rejected":
                continue
            existing_start = item.get("StartDate")
            existing_end = item.get("EndDate")
            if not existing_start or not existing_end:
                continue
            try:
                existing_start_dt = datetime.strptime(str(existing_start), "%Y-%m-%d")
                existing_end_dt = datetime.strptime(str(existing_end), "%Y-%m-%d")
            except ValueError:
                continue
            if start <= existing_end_dt and end >= existing_start_dt:
                return True
        return False

    @staticmethod
    async def count_pending() -> int:
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB database is not connected.")
        return await db.leaves.count_documents({"Status": {"$regex": r"^pending$", "$options": "i"}})


    @staticmethod
    async def get_all(
        status: Optional[str] = None,
        page: int = 1,
        size: int = 50,
        emp_id: Optional[str] = None,
        emp_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Build query using ACTUAL MongoDB field names
        # ---------------------------------------------------------

        query: Dict[str, Any] = {}

        if emp_ids:
            query["EmpID"] = {"$in": [str(item).strip() for item in emp_ids if str(item).strip()]}
        elif emp_id and str(emp_id).strip():
            query["EmpID"] = str(emp_id).strip()

        if status and status.lower() != "all":
            query["Status"] = {
                "$regex": f"^{status}$",
                "$options": "i"
            }

        # ---------------------------------------------------------
        # Pagination
        # ---------------------------------------------------------
        skip = (page - 1) * size

        cursor = db.leaves.find(
            query,
            {"_id": 0}
        ).skip(skip).limit(size)

        items = await cursor.to_list(
            length=size
        )

        # ---------------------------------------------------------
        # Convert MongoDB documents to API format
        # ---------------------------------------------------------

        return [
            normalize_leave(item)
            for item in items
        ]

    @staticmethod
    async def submit(
        request: LeaveRequestBase
    ) -> Dict[str, Any]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        if not request.empId or not str(request.empId).strip():
            raise ValueError("Invalid employee ID.")

        if request.status is not None and str(request.status).strip():
            normalized_status = LeaveService._normalize_status(request.status)
            if normalized_status != "Pending":
                raise ValueError("Leave status is HR-controlled. Employees can only submit Pending leave requests.")

        if not request.startDate or not str(request.startDate).strip():
            raise ValueError("Leave start date is required.")
        if not request.endDate or not str(request.endDate).strip():
            raise ValueError("Leave end date is required.")

        try:
            start = datetime.strptime(str(request.startDate), "%Y-%m-%d")
            end = datetime.strptime(str(request.endDate), "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("Leave dates must use YYYY-MM-DD format.") from exc

        if end < start:
            raise ValueError("Leave end date cannot be earlier than the start date.")

        days = (end - start).days + 1
        if days <= 0:
            raise ValueError("Leave duration must be at least one day.")

        if await LeaveService._has_overlapping_leave(str(request.empId).strip(), str(request.startDate), str(request.endDate)):
            raise ValueError("This leave request overlaps with another leave period for the same employee.")

        data = {
            "EmpID": str(request.empId).strip(),
            "LeaveType": request.leaveType,
            "StartDate": request.startDate,
            "EndDate": request.endDate,
            "Status": "Pending",
            "LeaveBalance": request.leaveBalance,
            "days": days,
            "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }

        await db.leaves.insert_one(data)

        return normalize_leave(data)

    @staticmethod
    async def update_status(
        leave_id: str,
        update: LeaveStatusUpdate
    ) -> Optional[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        normalized_status = LeaveService._normalize_status(update.status)
        query: Dict[str, Any] = {"_id": leave_id}
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(leave_id)}
        except Exception:
            query = {"id": leave_id}

        result = await db.leaves.find_one_and_update(
            query,
            {
                "$set": {
                    "Status": normalized_status
                }
            },
            return_document=True
        )

        if result:
            return normalize_leave(result)

        return None


# ==========================================================================
# 4. Shift Service
# ==========================================================================

class ShiftService:

    VALID_STATUSES = {"Pending", "Approved", "Rejected", "Not Requested"}

    @staticmethod
    def _normalize_status(raw_status: Optional[str]) -> str:
        if raw_status is None:
            return "Pending"
        value = str(raw_status).strip()
        if not value:
            return "Pending"
        normalized = value.title()
        if normalized not in ShiftService.VALID_STATUSES:
            raise ValueError("Shift status must be one of: Pending, Approved, Rejected, Not Requested.")
        return normalized

    @staticmethod
    async def count_pending() -> int:
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB database is not connected.")
        return await db.shifts.count_documents({"ShiftSwapStatus": {"$regex": r"^pending$", "$options": "i"}})


    # ----------------------------------------------------------------------
    # GET ALL SHIFT REQUESTS
    # ----------------------------------------------------------------------

    @staticmethod
    async def get_all(
        status: Optional[str] = None,
        page: int = 1,
        size: int = 50,
        emp_id: Optional[str] = None,
        emp_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Build query
        # ---------------------------------------------------------

        query: Dict[str, Any] = {}

        if emp_ids:
            query["EmpID"] = {"$in": [str(item).strip() for item in emp_ids if str(item).strip()]}
        elif emp_id and str(emp_id).strip():
            query["EmpID"] = str(emp_id).strip()

        if status and status.lower() != "all":

            normalized_status = status.strip().title()

            if normalized_status not in ShiftService.VALID_STATUSES:
                return []

            query["ShiftSwapStatus"] = normalized_status

        # ---------------------------------------------------------
        # Pagination
        # ---------------------------------------------------------
        skip = (page - 1) * size

        cursor = db.shifts.find(
            query,
            {"_id": 0}
        ).skip(skip).limit(size)

        items = await cursor.to_list(
            length=size
        )

        # ---------------------------------------------------------
        # Enrich employee information
        # ---------------------------------------------------------

        employee_ids = {
            item.get("EmpID")
            for item in items
            if item.get("EmpID")
        }

        employee_lookup: Dict[str, Dict[str, Any]] = {}
        if employee_ids:
            employee_cursor = db.employees.find(
                {"EmpID": {"$in": list(employee_ids)}},
                {"_id": 0}
            )
            employee_documents = await employee_cursor.to_list(length=None)
            for employee_document in employee_documents:
                employee_id = employee_document.get("EmpID")
                if employee_id:
                    employee_lookup[employee_id] = normalize_employee(employee_document)

        normalized_items = []

        for item in items:
            emp_id_val = item.get("EmpID")
            normalized_items.append(
                normalize_shift(
                    item,
                    employee_lookup.get(emp_id_val)
                )
            )

        return normalized_items

    # ----------------------------------------------------------------------
    # CREATE SHIFT REQUEST
    # ----------------------------------------------------------------------

    @staticmethod
    async def submit(
        request: ShiftRequestBase
    ) -> Dict[str, Any]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        if not request.empId or not str(request.empId).strip():
            raise ValueError("Invalid employee ID.")

        # ---------------------------------------------------------
        # Verify employee exists
        # ---------------------------------------------------------

        employee = await EmployeeService.get_by_id(
            str(request.empId).strip()
        )

        if not employee:
            raise ValueError(
                f"Employee '{request.empId}' was not found."
            )

        if not request.requestedShift or not str(request.requestedShift).strip():
            raise ValueError("requestedShift is required.")

        if not request.requestedDate or not str(request.requestedDate).strip():
            raise ValueError("requestedDate is required.")

        # ---------------------------------------------------------
        # Parse requested shift
        #
        # Expected:
        # "Night (22:00 - 07:00)"
        # ---------------------------------------------------------

        requested_shift = str(request.requestedShift).strip()

        if "(" not in requested_shift or ")" not in requested_shift:
            raise ValueError(
                "requestedShift must use the format "
                "'ShiftName (HH:MM - HH:MM)'."
            )

        try:

            shift_name = requested_shift.split(
                "(",
                1
            )[0].strip()

            time_part = requested_shift.split(
                "(",
                1
            )[1].rsplit(
                ")",
                1
            )[0].strip()

            shift_start, shift_end = [
                value.strip()
                for value in time_part.split(
                    "-",
                    1
                )
            ]

            if not shift_name:
                raise ValueError

            if not shift_start or not shift_end:
                raise ValueError

        except Exception:

            raise ValueError(
                "Invalid requestedShift format. "
                "Use 'Night (22:00 - 07:00)'."
            )

        # ---------------------------------------------------------
        # Validate date
        # ---------------------------------------------------------

        try:

            datetime.strptime(
                str(request.requestedDate),
                "%Y-%m-%d"
            )

        except ValueError as exc:

            raise ValueError(
                "requestedDate must use YYYY-MM-DD format."
            ) from exc

        # ---------------------------------------------------------
        # Generate next ShiftID atomically
        #
        # Counter currently contains:
        # seq = 20000
        #
        # Next ID:
        # SH-020001
        # ---------------------------------------------------------

        counter = await db.counters.find_one_and_update(
            {
                "_id": "shift_id"
            },
            {
                "$inc": {
                    "seq": 1
                }
            },
            upsert=True,
            return_document=True
        )

        sequence = counter["seq"]

        shift_id = f"SH-{sequence:06d}"

        # ---------------------------------------------------------
        # Create MongoDB document
        # ---------------------------------------------------------

        applied_on = datetime.now().strftime(
            "%Y-%m-%d"
        )

        record = {
            "EmpID": str(request.empId).strip(),
            "ShiftName": shift_name,
            "ShiftStart": shift_start,
            "ShiftEnd": shift_end,
            "OvertimeHours": 0.0,
            "ShiftSwapApproved": False,
            "ShiftDate": str(request.requestedDate),
            "ShiftID": shift_id,
            "ShiftSwapStatus": "Pending",
            "Reason": request.reason,
            "AppliedOn": applied_on
        }

        # ---------------------------------------------------------
        # Insert
        # ---------------------------------------------------------

        await db.shifts.insert_one(
            record
        )

        # ---------------------------------------------------------
        # Return API response
        # ---------------------------------------------------------

        return normalize_shift(
            record,
            employee
        )

    # ----------------------------------------------------------------------
    # UPDATE SHIFT STATUS
    # ----------------------------------------------------------------------

    @staticmethod
    async def update_status(
        shift_id: str,
        update: ShiftStatusUpdate
    ) -> Optional[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        current = await db.shifts.find_one(
            {"ShiftID": shift_id},
            projection={"_id": 0}
        )

        if not current:
            return None

        current_status = ShiftService._normalize_status(current.get("ShiftSwapStatus"))
        if current_status != "Pending":
            raise ValueError("Only pending shift requests can be approved or rejected.")

        emp_id = current.get("EmpID")
        if not emp_id:
            raise ValueError("Shift request is missing an employee ID.")

        employee = await EmployeeService.get_by_id(str(emp_id).strip())
        if not employee:
            raise ValueError(f"Employee '{emp_id}' was not found.")

        requested_shift_name = str(current.get("ShiftName") or "").strip()
        requested_shift_start = str(current.get("ShiftStart") or "").strip()
        requested_shift_end = str(current.get("ShiftEnd") or "").strip()
        if not requested_shift_name or not requested_shift_start or not requested_shift_end:
            raise ValueError("Requested shift data is incomplete and cannot be approved.")

        requested_date = str(current.get("ShiftDate") or "").strip()
        if requested_date:
            try:
                datetime.strptime(requested_date, "%Y-%m-%d")
            except ValueError as exc:
                raise ValueError("Requested date is invalid; use YYYY-MM-DD.") from exc

        new_status = ShiftService._normalize_status(update.status)
        approved = (new_status == "Approved")

        update_payload = {
            "$set": {
                "ShiftSwapStatus": new_status,
                "ShiftSwapApproved": approved,
            }
        }

        if getattr(update, "approverComments", None) is not None:
            comment = str(update.approverComments).strip()
            if comment:
                update_payload["$set"]["ManagerComments"] = comment

        result = await db.shifts.find_one_and_update(
            {
                "ShiftID": shift_id
            },
            update_payload,
            return_document=True,
            projection={
                "_id": 0
            }
        )

        if not result:
            return None

        employee = await EmployeeService.get_by_id(str(emp_id).strip())
        return normalize_shift(result, employee)


# ==========================================================================
# 5. Timesheet Service
# ==========================================================================

class TimesheetService:

    @staticmethod
    async def get_all(
        emp_id: Optional[str] = None,
        emp_ids: Optional[List[str]] = None,
        page: int = 1,
        size: int = 50
    ) -> List[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Build query using ACTUAL MongoDB field names
        # ---------------------------------------------------------

        query: Dict[str, Any] = {}

        if emp_ids:
            query["EmpID"] = {"$in": [str(item).strip() for item in emp_ids if str(item).strip()]}
        elif emp_id:
            query["EmpID"] = emp_id

        # ---------------------------------------------------------
        # Pagination
        # ---------------------------------------------------------
        skip = (page - 1) * size

        cursor = db.timesheets.find(
            query,
            {"_id": 0}
        ).skip(skip).limit(size)

        items = await cursor.to_list(
            length=size
        )

        # ---------------------------------------------------------
        # Convert MongoDB documents to API format
        # ---------------------------------------------------------

        return [
            normalize_timesheet(item)
            for item in items
        ]

    @staticmethod
    async def submit(
        timesheet: TimesheetBase
    ) -> Dict[str, Any]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        if not timesheet.empId or not str(timesheet.empId).strip():
            raise ValueError("Invalid employee ID.")

        data = {
            "EmpID": timesheet.empId,
            "Date": timesheet.date,
            "Project": timesheet.projectName,
            "HoursWorked": timesheet.hoursLogged,
            "ClientBillingHours": timesheet.clientBillingHours,
            "Status": timesheet.status or "Pending",
        }

        await db.timesheets.insert_one(data)
        return normalize_timesheet(data)

    @staticmethod
    async def update_status(
        timesheet_id: str,
        new_status: str
    ) -> Optional[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        query: Dict[str, Any] = {"_id": timesheet_id}
        try:
            from bson import ObjectId
            query = {"_id": ObjectId(timesheet_id)}
        except Exception:
            query = {"id": timesheet_id}

        result = await db.timesheets.find_one_and_update(
            query,
            {
                "$set": {
                    "Status": new_status
                }
            },
            return_document=True
        )

        if result:
            return normalize_timesheet(result)

        return None


# ==========================================================================
# 6. Payroll Service
# ==========================================================================

class PayrollService:

    @staticmethod
    async def get_all(
        month: Optional[str] = None,
        page: int = 1,
        size: int = 50
    ) -> List[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Build query using ACTUAL MongoDB field names
        # ---------------------------------------------------------

        query: Dict[str, Any] = {}

        if month:
            query["PayrollMonth"] = {
                "$regex": f"^{month}$",
                "$options": "i"
            }

        # ---------------------------------------------------------
        # Pagination
        # ---------------------------------------------------------
        skip = (page - 1) * size

        cursor = db.payroll.find(
            query,
            {"_id": 0}
        ).skip(skip).limit(size)

        items = await cursor.to_list(
            length=size
        )

        # ---------------------------------------------------------
        # Convert MongoDB documents to API format
        # ---------------------------------------------------------

        return [
            normalize_payroll(item)
            for item in items
        ]

    @staticmethod
    async def sum_net_salary_for_month(month: Optional[str] = None) -> float:
        """Return the total NetSalary for the provided PayrollMonth. If month is None, sum across all documents."""
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB database is not connected.")

        match_stage = { }
        if month:
            match_stage = {"$match": {"PayrollMonth": {"$regex": f"^{month}$", "$options": "i"}}}

        pipeline = []
        if match_stage:
            pipeline.append(match_stage)

        pipeline.append({
            "$group": {
                "_id": None,
                "total": {"$sum": {"$ifNull": ["$NetSalary", 0]}}
            }
        })

        cursor = db.payroll.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        if result:
            return float(result[0].get("total", 0.0) or 0.0)
        return 0.0

    @staticmethod
    async def calculate(
        month: str = "2023-05"
    ) -> List[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        query = {}
        if month:
            query["PayrollMonth"] = {"$regex": f"^{month}$", "$options": "i"}

        items = await db.payroll.find(query, {"_id": 0}).to_list(length=5000)
        return [normalize_payroll(item) for item in items]

    @staticmethod
    async def disburse(
        payroll_id: str
    ) -> Optional[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        result = await db.payroll.find_one({"_id": payroll_id})
        if not result:
            result = await db.payroll.find_one({"id": payroll_id})

        if result:
            return normalize_payroll(result)

        return None


# ==========================================================================
# 7. Performance Service
# ==========================================================================

class PerformanceService:

    @staticmethod
    async def create(
        data: PerformanceBase
    ) -> Dict[str, Any]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Check if performance record already exists
        # ---------------------------------------------------------

        existing = await db.performance.find_one(
            {"EmpID": data.empId}
        )

        if existing:
            raise ValueError(
                f"Performance record for employee "
                f"'{data.empId}' already exists."
            )

        # ---------------------------------------------------------
        # Convert API fields to MongoDB fields
        #
        # MongoDB dataset uses:
        # EmpID
        # KPI
        # GoalCompletion
        # ProductivityScore
        # PerformanceRating
        # ReviewDate
        #
        # ---------------------------------------------------------

        doc = {
            "EmpID": data.empId,
            "KPI": data.performanceScore,
            "GoalCompletion": data.kpiCompletionRate,
            "ProductivityScore": data.productivityScore,
            "PerformanceRating": (
                5
                if data.performanceScore >= 90
                else 4
                if data.performanceScore >= 75
                else 3
                if data.performanceScore >= 60
                else 2
                if data.performanceScore >= 40
                else 1
            ),
            "ReviewDate": datetime.now().strftime(
                "%Y-%m-%d"
            )
        }

        await db.performance.insert_one(doc)

        return normalize_performance(doc)

    @staticmethod
    async def get_all() -> List[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        cursor = db.performance.find(
            {},
            {"_id": 0}
        )

        items = await cursor.to_list(
            length=None
        )

        return [
            normalize_performance(item)
            for item in items
        ]

    @staticmethod
    async def get_by_emp_id(
        emp_id: str
    ) -> Optional[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # IMPORTANT:
        # MongoDB uses EmpID, not empId.

        result = await db.performance.find_one(
            {
                "EmpID": emp_id
            },
            {"_id": 0}
        )

        if result:
            return normalize_performance(result)

        return None

    @staticmethod
    async def update(
        emp_id: str,
        data: PerformanceUpdate
    ) -> Optional[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Convert API field names to MongoDB field names
        # ---------------------------------------------------------

        update_fields: Dict[str, Any] = {}

        if data.performanceScore is not None:
            update_fields["KPI"] = data.performanceScore

        if data.kpiCompletionRate is not None:
            update_fields["GoalCompletion"] = (
                data.kpiCompletionRate
            )

        if data.productivityScore is not None:
            update_fields["ProductivityScore"] = (
                data.productivityScore
            )

        # ---------------------------------------------------------
        # PerformanceRating is not directly exposed in
        # PerformanceUpdate, so it is derived from
        # performanceScore if performanceScore is updated.
        # ---------------------------------------------------------

        if data.performanceScore is not None:

            score = data.performanceScore

            if score >= 90:
                rating = 5
            elif score >= 75:
                rating = 4
            elif score >= 60:
                rating = 3
            elif score >= 40:
                rating = 2
            else:
                rating = 1

            update_fields["PerformanceRating"] = rating

        if not update_fields:
            return await PerformanceService.get_by_emp_id(
                emp_id
            )

        # ---------------------------------------------------------
        # Update actual MongoDB fields
        # ---------------------------------------------------------

        result = await db.performance.find_one_and_update(
            {
                "EmpID": emp_id
            },
            {
                "$set": update_fields
            },
            return_document=True,
            projection={"_id": 0}
        )

        if result:
            return normalize_performance(result)

        return None

    @staticmethod
    async def delete(
        emp_id: str
    ) -> bool:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        result = await db.performance.delete_one(
            {
                "EmpID": emp_id
            }
        )

        return result.deleted_count > 0

# ==========================================================================
# 8. Notification Service
# ==========================================================================

class NotificationService:

    @staticmethod
    def _notification_match_query(notif_id: str) -> Dict[str, Any]:
        or_clauses = [
            {"id": notif_id},
            {
                "$expr": {
                    "$eq": [
                        {
                            "$concat": [
                                "NOTIF-",
                                "$EmpID",
                                "-",
                                "$NotificationDate"
                            ]
                        },
                        notif_id
                    ]
                }
            },
            {"_id": notif_id}
        ]

        try:
            from bson import ObjectId
            oid = ObjectId(notif_id)
            or_clauses.insert(0, {"_id": oid})
        except Exception:
            pass

        return {"$or": or_clauses}

    @staticmethod
    async def create(
        data: NotificationCreate
    ) -> Dict[str, Any]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        notification = {
            "Type": data.type or "System",
            "Message": data.message or data.title or "Notification",
            "Status": data.status or "Unread",
            "NotificationDate": datetime.now().strftime("%Y-%m-%d")
        }

        if data.empId:
            notification["EmpID"] = data.empId

        await db.notifications.insert_one(notification)

        return normalize_notification(notification)

    @staticmethod
    async def get_by_id(notif_id: str) -> Optional[Dict[str, Any]]:
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB database is not connected.")

        existing = await db.notifications.find_one(NotificationService._notification_match_query(notif_id))
        if not existing:
            return None
        return normalize_notification(existing)

    @staticmethod
    async def get_all(page: int = 1, size: int = 50, emp_id: Optional[str] = None) -> List[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        query: Dict[str, Any] = {}
        if emp_id and str(emp_id).strip():
            query["EmpID"] = str(emp_id).strip()

        skip = (page - 1) * size

        # Include MongoDB _id so we can synthesize a stable API id, but only return the specific fields we need
        cursor = db.notifications.find(
            query,
            {"_id": 1, "id": 1, "EmpID": 1, "Type": 1, "Message": 1, "Status": 1, "NotificationDate": 1, "priority": 1}
        ).skip(skip).limit(size)

        items = await cursor.to_list(
            length=size
        )

        return [
            normalize_notification(item)
            for item in items
        ]

    @staticmethod
    async def mark_read(
        notif_id: str,
        emp_id: Optional[str] = None,
        role: Optional[str] = None
    ) -> bool:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        existing = await db.notifications.find_one(NotificationService._notification_match_query(notif_id))
        if not existing:
            return False

        if emp_id and str(role or "").upper() != "HR_ADMIN":
            if str(existing.get("EmpID") or "").strip() != str(emp_id).strip():
                return False

        result = await db.notifications.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "Status": "Read",
                    "isRead": True
                }
            }
        )

        return (
            result.modified_count > 0
            or result.matched_count > 0
        )

    @staticmethod
    async def mark_all_read(
        emp_id: Optional[str] = None,
        role: Optional[str] = None
    ) -> bool:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        query: Dict[str, Any] = {}
        if emp_id and str(role or "").upper() != "HR_ADMIN":
            query["EmpID"] = str(emp_id).strip()

        await db.notifications.update_many(
            query,
            {
                "$set": {
                    "Status": "Read",
                    "isRead": True
                }
            }
        )

        return True


# ==========================================================================
# 9. Audit Service
# ==========================================================================

class AuditService:

    @staticmethod
    async def get_all() -> List[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # Include MongoDB _id so older audit records that lack an explicit
        # 'id' can be synthesized by normalize_audit_log. Returning full
        # documents is acceptable for audit logs (sensitive fields are
        # already API-oriented in this collection).
        cursor = db.audit_logs.find()

        items = await cursor.to_list(
            length=None
        )

        return [
            normalize_audit_log(item)
            for item in items
        ]

    @staticmethod
    async def create(
        data: AuditLogCreate
    ) -> Dict[str, Any]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        # ---------------------------------------------------------
        # Audit collection already uses API-friendly field names:
        #
        # actor
        # action
        # module
        # ipAddress
        # status
        # id
        # timestamp
        #
        # Therefore no raw-field conversion is required.
        # ---------------------------------------------------------

        doc = data.model_dump()

        # ---------------------------------------------------------
        # Generate unique audit log ID
        # ---------------------------------------------------------

        doc["id"] = (
            f"AUD-"
            f"{uuid.uuid4().hex[:6].upper()}"
        )

        # ---------------------------------------------------------
        # Generate timestamp
        # ---------------------------------------------------------

        doc["timestamp"] = datetime.now().isoformat()

        # ---------------------------------------------------------
        # Insert into MongoDB
        # ---------------------------------------------------------

        await db.audit_logs.insert_one(doc)

        return normalize_audit_log(doc)

# ==========================================================================
# 10. AI Prediction Service
# ==========================================================================

class AIPredictionService:
    @staticmethod
    async def count_attrition_above(threshold: float = 0.7) -> int:
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB database is not connected.")
        return await db.ai_predictions.count_documents({"AttritionRisk": {"$gt": threshold}})


    @staticmethod
    async def get_all(
        emp_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        query: Dict[str, Any] = {}

        # ---------------------------------------------------------
        # Filter by employee
        # ---------------------------------------------------------

        if emp_id:
            query["EmpID"] = emp_id

        # ---------------------------------------------------------
        # Read AI prediction records
        # ---------------------------------------------------------

        cursor = db.ai_predictions.find(
            query,
            {"_id": 0}
        )

        items = await cursor.to_list(
            length=None
        )

        return [
            normalize_ai_prediction(item)
            for item in items
        ]

    @staticmethod
    async def get_by_emp_id(
        emp_id: str
    ) -> Optional[Dict[str, Any]]:

        db = get_database()

        if db is None:
            raise RuntimeError(
                "MongoDB database is not connected."
            )

        prediction = await db.ai_predictions.find_one(
            {
                "EmpID": emp_id
            },
            {
                "_id": 0
            }
        )

        if prediction:
            return normalize_ai_prediction(
                prediction
            )

        return None