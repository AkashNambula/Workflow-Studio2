from app.worker.celery_app import celery_app
from app.db.database import db
from app.services.email_service import (
    generate_welcome_pdf,
    dispatch_automated_email
)

@celery_app.task
def execute_workflow_task(workflow_name, employee_data, run_id):

    print(f"Running workflow: {workflow_name}")
    print(f"Run ID: {run_id}")

    workflow = db.workflows.find_one(
        {"name": workflow_name}
    )

    print("Workflow Found =", workflow is not None)
    print("Employee Data =", employee_data)

    employees = employee_data.get("employees", [])

    for employee in employees:

        emp_name = employee.get("name", "Employee")
        emp_email = employee.get("email")
        emp_role = employee.get("role", "Associate")

        if not emp_email:
            continue

        pdf_path = generate_welcome_pdf(
            employee_name=emp_name,
            role=emp_role
        )
        
        dispatch_automated_email(
            target_email=emp_email,
            subject=f"Welcome to the Team, {emp_name}! - HR Automation Studio",
            message_body=f"""
    Hello {emp_name},

    Congratulations and welcome to the team!

    Your onboarding workflow has been completed successfully.

    Please find your official welcome letter attached with this email.

    Role: {emp_role}

    We are excited to have you join us and wish you great success in your new role.

    Best Regards,
    HR Automation Operations Team
    """,
            attachment_path=pdf_path
        )

        print(f"Email sent to {emp_email}")

    return {
        "run_id": run_id,
        "workflow_name": workflow_name,
        "status": "SUCCESS"
    }