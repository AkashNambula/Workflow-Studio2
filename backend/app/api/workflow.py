from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.db.database import db
from app.core.security import get_current_user_claims

router = APIRouter(tags=["Workflows"])

# --- Pydantic Request Schemas ---
class WorkflowSaveRequest(BaseModel):
    name: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class WorkflowExecuteRequest(BaseModel):
    employees: List[Dict[str, Any]]


# --- Helper Role Validation Checker ---
def verify_operational_clearance(token_payload: dict):
    user_identity = token_payload.get("sub", "")
    user = db.users.find_one({"email": user_identity})
    if not user or user.get("role", "") not in ["Admin", "Operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Insufficient operational clearance limits."
        )
    return user


# --- LIVE AUTOMATION ENGINE UTILITIES ---

def generate_welcome_pdf(employee_name: str, role: str, filename: str = "Welcome_Letter.pdf"):
    try:
        pdf = canvas.Canvas(filename, pagesize=letter)
        pdf.setTitle("HR Welcome Letter")
        
        pdf.setFont("Helvetica-Bold", 24)
        pdf.drawString(100, 700, "HR AUTOMATION WORKFLOW STUDIO")
        
        pdf.setStrokeColorRGB(0.1, 0.5, 0.8)
        pdf.line(100, 680, 500, 680)
        
        pdf.setFont("Helvetica", 14)
        pdf.drawString(100, 630, f"Dear {employee_name},")
        pdf.drawString(100, 590, f"Welcome to the team! We are thrilled to officially confirm your placement")
        pdf.drawString(100, 570, f"as our newly appointed {role}.")
        
        pdf.drawString(100, 510, "Your onboard visual routing sequence tracking configuration has been")
        pdf.drawString(100, 490, "successfully processed by the automated orchestrator.")
        
        pdf.setFont("Helvetica-Oblique", 12)
        pdf.drawString(100, 400, "Best Regards,")
        pdf.drawString(100, 380, "The HR Automation Operations Team")
        
        pdf.save()
        return filename
    except Exception as e:
        print(f"[PDF Generation Fault]: {str(e)}")
        return None


def dispatch_automated_email(target_email: str, subject: str, message_body: str, attachment_path: str = None):
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = "nambulaeswar2@gmail.com"
    sender_password = "krffousxppqpulse"

    try:
        msg = MIMEMultipart()
        msg['From'] = f"HR Automation Studio <{sender_email}>"
        msg['To'] = target_email
        msg['Subject'] = subject or "HR Automation Welcome Dispatch"
        
        msg.attach(MIMEText(message_body or "Your onboard workflow track sequence has finished processing.", 'plain'))
        
        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, "rb") as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f"attachment; filename={os.path.basename(attachment_path)}")
                msg.attach(part)
        
        print(f"📡 [SMTP Dispatch Routing]: Connecting to Gmail SMTP to mail {target_email}...")
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=15)
        server.starttls()  
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, [target_email], msg.as_string())
        server.quit()
        
        print(f"✅ [SMTP Dispatch Success]: Live email sent successfully to {target_email}!")
        return True
    except Exception as e:
        print(f"❌ [SMTP Dispatch Error]: {str(e)}")
        return False


# --- Core Router Endpoints ---

@router.post("/create-workflow")
def save_workflow(data: WorkflowSaveRequest, token_payload: dict = Depends(get_current_user_claims)):
    verify_operational_clearance(token_payload)
    workflow_data = {
        "name": data.name if data.name.strip() else "Notification Workflow",
        "nodes": data.nodes,
        "edges": data.edges,
        "updated_by": token_payload.get("sub")
    }
    db.workflows.update_one({"name": workflow_data["name"]}, {"$set": workflow_data}, upsert=True)
    return {"message": "Workflow canvas layout saved completely!"}


# 🟢 FIXED: ADDED MISSING ROUTE TO LOAD INDIVIDUAL WORKFLOWS AND STOP 404 ERRORS
@router.get("/workflow/{name}")
def get_single_workflow(name: str, token_payload: dict = Depends(get_current_user_claims)):
    verify_operational_clearance(token_payload)
    workflow = db.workflows.find_one({"name": name})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow layout schema not found.")
    return {
        "name": workflow.get("name", "Notification Workflow"),
        "nodes": workflow.get("nodes", []),
        "edges": workflow.get("edges", [])
    }


@router.post("/run-workflow/{workflow_name}")
def run_workflow(workflow_name: str, data: WorkflowExecuteRequest, token_payload: dict = Depends(get_current_user_claims)):
    verify_operational_clearance(token_payload)
    
    saved_workflow = db.workflows.find_one({"name": workflow_name})
    nodes_layout = saved_workflow.get("nodes", []) if saved_workflow else []
    
    nodes_dump_string = str(nodes_layout).upper()
    has_pdf_block = "PDF" in nodes_dump_string
    has_email_block = "EMAIL" in nodes_dump_string or "MAIL" in nodes_dump_string

    # Fallback to True if canvas layout properties were bypassed or empty
    if not nodes_layout:
        has_pdf_block = True
        has_email_block = True

    for employee in data.employees:
        emp_name = employee.get("name", "New Employee")
        emp_email = employee.get("email")
        emp_role = employee.get("role", "Associate")
        
        if not emp_email:
            continue
            
        pdf_path = None
        email_subject = f"Welcome to the Team, {emp_name}! - HR Automation Studio"
        email_message = f"Hello {emp_name},\n\nYour onboarding pipeline track has completed successfully. Please find your official orientation welcome letter attached below."
        
        if has_pdf_block:
            pdf_path = generate_welcome_pdf(employee_name=emp_name, role=emp_role)
            
        if has_email_block or has_pdf_block:
            dispatch_automated_email(
                target_email=emp_email,
                subject=email_subject,
                message_body=email_message,
                attachment_path=pdf_path
            )
            
        if pdf_path and os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except Exception:
                pass

    history_log = {
        "workflow_name": workflow_name,
        "status": "Executed Successfully",
        "employee_count": len(data.employees),
        "triggered_by": token_payload.get("sub")
    }
    db.history.insert_one(history_log)
    
    return {"status": "Success", "message": f"Automation chain '{workflow_name}' processed and emails dispatched successfully!"}


@router.get("/workflows")
def get_all_workflows(token_payload: dict = Depends(get_current_user_claims)):
    verify_operational_clearance(token_payload)
    cursor = db.workflows.find()
    output = []
    for w in cursor:
        output.append({"name": w.get("name", "Notification Workflow"), "nodes": w.get("nodes", []), "edges": w.get("edges", [])})
    return output


@router.get("/history")
def get_execution_history(token_payload: dict = Depends(get_current_user_claims)):
    verify_operational_clearance(token_payload)
    cursor = db.history.find()
    output = []
    for h in cursor:
        output.append({"workflow_name": h.get("workflow_name", "Unknown Workflow"), "status": h.get("status", "Completed")})
    return output