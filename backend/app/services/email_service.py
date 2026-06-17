import os
import smtplib

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
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

        msg["From"] = f"HR Automation Studio <{sender_email}>"
        msg["To"] = target_email
        msg["Subject"] = subject or "HR Automation Welcome Dispatch"

        msg.attach(
            MIMEText(
                message_body or "Your onboard workflow track sequence has finished processing.",
                "plain"
            )
        )

        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, "rb") as attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f"attachment; filename={os.path.basename(attachment_path)}"
                )
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