import math
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from backend.app.models.schemas import (
    EmployeeResponse,
    EmployeeCreate,
    EmployeeUpdate,
    PaginatedResponse
)

from backend.app.services.workforce_services import (
    EmployeeService
)


# ==========================================================================
# Router Configuration
# ==========================================================================

router = APIRouter(
    prefix="/employees",
    tags=["Employee Management"]
)


# ==========================================================================
# GET ALL EMPLOYEES
# ==========================================================================

@router.get(
    "",
    response_model=PaginatedResponse[EmployeeResponse]
)
async def get_employees(
    department: Optional[str] = Query(
        None,
        description="Filter by department name"
    ),

    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by employment status"
    ),

    search: Optional[str] = Query(
        None,
        description="Search by employee ID, name, email, department, role, or location"
    ),

    sort_by: str = Query(
        "empId",
        description="Field to sort by"
    ),

    sort_order: str = Query(
        "asc",
        description="Sort order: asc or desc"
    ),

    page: int = Query(
        1,
        ge=1,
        description="Page number"
    ),

    size: int = Query(
        50,
        ge=1,
        le=500,
        description="Number of records per page"
    )
):
    """
    Retrieve employees with filtering,
    searching, sorting and pagination.
    """

    items, total = await EmployeeService.get_all(
        department=department,
        status=status_filter,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        size=size
    )

    pages = math.ceil(total / size) if size > 0 else 1

    return PaginatedResponse[EmployeeResponse](
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


# ==========================================================================
# GET EMPLOYEE BY ID
# ==========================================================================

@router.get(
    "/{emp_id}",
    response_model=EmployeeResponse
)
async def get_employee_by_id(
    emp_id: str
):
    """
    Retrieve a single employee using Employee ID.
    """

    employee = await EmployeeService.get_by_id(
        emp_id
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Employee record for ID "
                f"'{emp_id}' was not found."
            )
        )

    return employee


# ==========================================================================
# CREATE EMPLOYEE
# ==========================================================================

@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_employee(
    employee: EmployeeCreate
):
    """
    Register a new employee.

    NOTE:
    The EmployeeService.create() operation will be
    handled separately because the existing MongoDB
    dataset uses legacy field names such as EmpID,
    EmployeeName, Department, etc.
    """

    existing = await EmployeeService.get_by_id(
        employee.empId
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Employee ID "
                f"'{employee.empId}' already exists."
            )
        )

    return await EmployeeService.create(
        employee
    )


# ==========================================================================
# UPDATE EMPLOYEE
# ==========================================================================

@router.put(
    "/{emp_id}",
    response_model=EmployeeResponse
)
async def update_employee(
    emp_id: str,
    employee_update: EmployeeUpdate
):
    """
    Update an existing employee.
    """

    updated_employee = await EmployeeService.update(
        emp_id,
        employee_update
    )

    if not updated_employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Employee record for ID "
                f"'{emp_id}' was not found."
            )
        )

    return updated_employee


# ==========================================================================
# DELETE EMPLOYEE
# ==========================================================================

@router.delete(
    "/{emp_id}",
    status_code=status.HTTP_200_OK
)
async def delete_employee(
    emp_id: str
):
    """
    Delete an employee record.
    """

    success = await EmployeeService.delete(
        emp_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Employee record for ID "
                f"'{emp_id}' was not found."
            )
        )

    return {
        "message": (
            f"Employee record {emp_id} "
            "successfully deleted."
        )
    }