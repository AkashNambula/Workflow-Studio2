"""
Pytest tests for the workflow execution endpoint (app.api.run module).

These tests verify the FastAPI endpoint behavior for the /run-workflow/{workflow_name} route.
All external dependencies (MongoDB, Redis, Celery) are mocked to isolate the endpoint logic.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import HTTPException
from app.api.run import execute_workflow, RunRequest, Employee
from app.core.security import require_operator_or_admin
from jose.exceptions import JWTError


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def sample_request():
    """Create a valid RunRequest with employee data."""
    return RunRequest(
        employees=[
            Employee(
                name="Prasad",
                email="prasad@gmail.com",
                phone="9876543210",
                role="Admin",
                joining_date="2026-06-04"
            )
        ]
    )


@pytest.fixture
def operator_user():
    """Mock operator user with valid credentials."""
    return {
        "sub": "operator@example.com",
        "role": "Operator"
    }


@pytest.fixture
def admin_user():
    """Mock admin user with valid credentials."""
    return {
        "sub": "admin@example.com",
        "role": "Admin"
    }


# ============================================================================
# RBAC / AUTHENTICATION TESTS (Synchronous - no async)
# ============================================================================

def test_viewer_role_is_rejected():
    """
    TEST 4: Viewer role is rejected.
    
    Verify that a user with Viewer role cannot execute workflows.
    Expected: HTTP 403 Forbidden.
    """
    viewer_credentials = MagicMock()
    viewer_credentials.credentials = "viewer-token"

    with patch("app.core.security.jwt.decode") as mock_decode:
        mock_decode.return_value = {
            "sub": "viewer@example.com",
            "role": "Viewer"
        }

        with pytest.raises(HTTPException) as exc:
            require_operator_or_admin(viewer_credentials)

        assert exc.value.status_code == 403
        assert "operational clearance" in exc.value.detail.lower()


def test_invalid_token_is_rejected():
    """
    TEST 5: Invalid token is rejected.
    
    Verify that an invalid/expired token is rejected.
    Expected: HTTP 401 Unauthorized.
    """
    invalid_credentials = MagicMock()
    invalid_credentials.credentials = "invalid-token"

    with patch("app.core.security.jwt.decode") as mock_decode:
        mock_decode.side_effect = JWTError("Invalid token")

        with pytest.raises(HTTPException) as exc:
            require_operator_or_admin(invalid_credentials)

        assert exc.value.status_code == 401


# ============================================================================
# WORKFLOW EXECUTION TESTS (Asynchronous)
# ============================================================================

@pytest.mark.asyncio
async def test_valid_workflow_is_queued(sample_request, operator_user):
    """
    TEST 1: Valid workflow request.
    
    Verify that when:
    - the workflow exists
    - the user has valid operational access (Operator or Admin)
    - the idempotency lock is acquired
    
    The endpoint:
    - creates a run ID (UUID)
    - creates the Saga state
    - queues execute_workflow_task
    - returns a successful response with run_id
    """
    mock_workflow = {
        "name": "prasad job",
        "nodes": [],
        "edges": []
    }
    
    with patch("app.api.run.db") as mock_db, \
         patch("app.api.run.execute_workflow_task.delay") as mock_delay, \
         patch("app.api.run.acquire_lock", new_callable=AsyncMock) as mock_acquire_lock, \
         patch("app.api.run.SagaState.create") as mock_saga_create:
        
        # Setup mock db
        mock_db.workflows.find_one.return_value = mock_workflow
        
        # Async mock that returns True
        mock_acquire_lock.return_value = True

        result = await execute_workflow(
            "prasad job",
            sample_request,
            operator_user
        )

        # Verify successful response
        assert result["message"] == "Workflow queued successfully"
        assert "run_id" in result
        assert len(result["run_id"]) == 36  # UUID format

        # Verify Saga state was created
        mock_saga_create.assert_called_once()

        # Verify Celery task was queued
        mock_delay.assert_called_once()


@pytest.mark.asyncio
async def test_workflow_not_found(sample_request, operator_user):
    """
    TEST 2: Workflow not found.
    
    Verify that when the requested workflow does not exist:
    - db.workflows.find_one returns None
    
    Expected:
    - HTTP 404 Not Found
    - Error message indicates workflow not found
    """
    with patch("app.api.run.db") as mock_db:
        mock_db.workflows.find_one.return_value = None

        with pytest.raises(HTTPException) as exc:
            await execute_workflow(
                "unknown-workflow",
                sample_request,
                operator_user
            )

        assert exc.value.status_code == 404
        assert "not found" in exc.value.detail.lower()


@pytest.mark.asyncio
async def test_duplicate_workflow_request(sample_request, operator_user):
    """
    TEST 3: Duplicate workflow request (idempotency lock fails).
    
    Verify that when:
    - acquire_lock returns False (idempotency key already acquired)
    
    Expected:
    - HTTP 409 Conflict
    - Error message indicates duplicate request
    - Celery task should not be queued
    
    """
    mock_workflow = {
        "name": "prasad job",
        "nodes": [],
        "edges": []
    }
    
    with patch("app.api.run.db") as mock_db, \
         patch("app.api.run.execute_workflow_task.delay") as mock_delay, \
         patch("app.api.run.acquire_lock", new_callable=AsyncMock) as mock_acquire_lock, \
         patch("app.api.run.SagaState.create") as mock_saga_create:
        
        mock_db.workflows.find_one.return_value = mock_workflow

        # Async mock that returns False (lock already acquired)
        mock_acquire_lock.return_value = False

        with pytest.raises(HTTPException) as exc:
            await execute_workflow(
                "prasad job",
                sample_request,
                operator_user
            )

        assert exc.value.status_code == 409
        assert "Duplicate" in exc.value.detail

        # Verify Celery task was NOT queued
        mock_delay.assert_not_called()


@pytest.mark.asyncio
async def test_admin_role_can_execute(sample_request, admin_user):
    """
    TEST 6: Admin role can execute workflows.
    
    Verify that an Admin user (in addition to Operator) can successfully execute workflows.
    """
    mock_workflow = {
        "name": "test-workflow",
        "nodes": [],
        "edges": []
    }
    
    with patch("app.api.run.db") as mock_db, \
         patch("app.api.run.execute_workflow_task.delay") as mock_delay, \
         patch("app.api.run.acquire_lock", new_callable=AsyncMock) as mock_acquire_lock, \
         patch("app.api.run.SagaState.create") as mock_saga_create:
        
        mock_db.workflows.find_one.return_value = mock_workflow
        
        mock_acquire_lock.return_value = True

        result = await execute_workflow(
            "test-workflow",
            sample_request,
            admin_user
        )

        assert result["message"] == "Workflow queued successfully"
        assert "run_id" in result
        mock_delay.assert_called_once()


@pytest.mark.asyncio
async def test_employee_data_transformation(sample_request, operator_user):
    """
    TEST 7: Employee data is correctly transformed before queueing.
    
    Verify that employee Pydantic models are correctly converted to dictionaries
    before being passed to the Celery task.
    """
    mock_workflow = {
        "name": "test-workflow",
        "nodes": [],
        "edges": []
    }
    
    with patch("app.api.run.db") as mock_db, \
         patch("app.api.run.execute_workflow_task.delay") as mock_delay, \
         patch("app.api.run.acquire_lock", new_callable=AsyncMock) as mock_acquire_lock, \
         patch("app.api.run.SagaState.create") as mock_saga_create:
        
        mock_db.workflows.find_one.return_value = mock_workflow
        
        mock_acquire_lock.return_value = True

        await execute_workflow(
            "test-workflow",
            sample_request,
            operator_user
        )

        # Verify the task was called with correct data structure
        mock_delay.assert_called_once()
        call_args = mock_delay.call_args

        # Extract arguments: execute_workflow_task.delay(workflow_name, employee_data_dict, run_id)
        workflow_name = call_args[0][0]
        employee_data = call_args[0][1]
        run_id = call_args[0][2]

        assert workflow_name == "test-workflow"
        assert "employees" in employee_data
        assert len(employee_data["employees"]) == 1
        
        # Verify employee dict contains expected fields
        emp_dict = employee_data["employees"][0]
        assert emp_dict["name"] == "Prasad"
        assert emp_dict["email"] == "prasad@gmail.com"
        assert emp_dict["phone"] == "9876543210"
        assert emp_dict["role"] == "Admin"


@pytest.mark.asyncio
async def test_saga_state_receives_correct_parameters(sample_request, operator_user):
    """
    TEST 8: SagaState.create receives correct parameters.
    
    Verify that SagaState.create is called with:
    - Generated run_id (UUID)
    - Workflow name
    """
    mock_workflow = {
        "name": "test-workflow",
        "nodes": [],
        "edges": []
    }
    
    with patch("app.api.run.db") as mock_db, \
         patch("app.api.run.execute_workflow_task.delay") as mock_delay, \
         patch("app.api.run.acquire_lock", new_callable=AsyncMock) as mock_acquire_lock, \
         patch("app.api.run.SagaState.create") as mock_saga_create:
        
        mock_db.workflows.find_one.return_value = mock_workflow
        
        mock_acquire_lock.return_value = True

        await execute_workflow(
            "test-workflow",
            sample_request,
            operator_user
        )

        # Verify SagaState.create was called with correct parameters
        mock_saga_create.assert_called_once()
        call_args = mock_saga_create.call_args

        run_id = call_args[0][0]
        workflow_name = call_args[0][1]

        assert workflow_name == "test-workflow"
        assert isinstance(run_id, str)
        assert len(run_id) == 36  # UUID v4 format


@pytest.mark.asyncio
async def test_idempotency_key_formation(sample_request, operator_user):
    """
    TEST 9: Idempotency key is correctly formed.
    
    Verify that the idempotency key passed to acquire_lock is:
    {workflow_name}:{employee_email}
    """
    mock_workflow = {
        "name": "test-workflow",
        "nodes": [],
        "edges": []
    }
    
    with patch("app.api.run.db") as mock_db, \
         patch("app.api.run.execute_workflow_task.delay") as mock_delay, \
         patch("app.api.run.acquire_lock", new_callable=AsyncMock) as mock_acquire_lock, \
         patch("app.api.run.SagaState.create") as mock_saga_create:
        
        mock_db.workflows.find_one.return_value = mock_workflow
        
        mock_acquire_lock.return_value = True

        await execute_workflow(
            "test-workflow",
            sample_request,
            operator_user
        )

        # Verify acquire_lock was called with correct idempotency key
        mock_acquire_lock.assert_called_once()
        call_args = mock_acquire_lock.call_args

        idempotency_key = call_args[0][0]
        expected_key = "test-workflow:prasad@gmail.com"

        assert idempotency_key == expected_key


@pytest.mark.asyncio
async def test_celery_task_not_queued_when_lock_fails(sample_request, operator_user):
    """
    TEST 10: Celery task is not queued when idempotency lock fails.
    
    Verify that if acquire_lock returns False (duplicate request),
    the Celery task.delay() is never called.
    """
    mock_workflow = {
        "name": "test-workflow",
        "nodes": [],
        "edges": []
    }
    
    with patch("app.api.run.db") as mock_db, \
         patch("app.api.run.execute_workflow_task.delay") as mock_delay, \
         patch("app.api.run.acquire_lock", new_callable=AsyncMock) as mock_acquire_lock, \
         patch("app.api.run.SagaState.create") as mock_saga_create:
        
        mock_db.workflows.find_one.return_value = mock_workflow
        
        # Lock acquisition fails
        mock_acquire_lock.return_value = False

        with pytest.raises(HTTPException):
            await execute_workflow(
                "test-workflow",
                sample_request,
                operator_user
            )

        # Verify Celery task was NOT queued
        mock_delay.assert_not_called()