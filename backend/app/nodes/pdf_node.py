from app.nodes.base import BaseNode
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime
import os

from pymongo import MongoClient
from gridfs import GridFS


class PdfNode(BaseNode):
    def execute(
        self,
        employee_name,
        employee_email,
        role,
        joining_date,
        workflow_name,
        pdf_title
    ):
        folder = "generated_pdfs"
        os.makedirs(folder, exist_ok=True)

        file_name = f"{pdf_title}_{employee_name}.pdf".replace(" ", "_")
        file_path = os.path.join(folder, file_name)

        c = canvas.Canvas(file_path, pagesize=A4)
        width, height = A4

        y = height - 60

        c.setFont("Helvetica-Bold", 18)
        c.drawString(70, y, "NAXRITA SOLUTIONS PRIVATE LIMITED")

        y -= 40
        c.setFont("Helvetica-Bold", 15)
        c.drawString(70, y, pdf_title if pdf_title else "Employee Onboarding Welcome Letter")
        y -= 50
        
        c.setFont("Helvetica", 11)

        lines = [
            f"Dear {employee_name},",
            "",
            "We are delighted to officially welcome you to Naxrita Solutions Private Limited.",
            "",
            "At Naxrita, we specialize in delivering innovative enterprise software solutions,",
            "workflow automation platforms, scalable digital transformation services, and",
            "business process optimization technologies for modern businesses.",
            "",
            f"Your appointment as {role} marks the beginning of an exciting professional",
            "journey with our organization.",
            "",
            "Our Mission:",
            "To empower organizations through automation, innovation, and digital excellence.",
            "",
            "Our Core Values:",
            "- Innovation",
            "- Collaboration",
            "- Integrity",
            "- Continuous Learning",
            "- Customer Excellence",
            "",
            "Employee Information:",
            "...", # Keeps your original list structure intact
            f"Employee Name: {employee_name}",
            f"Employee Email: {employee_email}",
            f"Role: {role}",
            f"Joining Date: {joining_date}",
            f"Workflow Name: {workflow_name}",
            f"Generated Date: {datetime.now().strftime('%d-%m-%Y')}",
            "",
            "Onboarding Instructions:",
            "1. Complete all HR documentation.",
            "2. Attend the induction and orientation session.",
            "3. Configure your official company email.",
            "4. Setup required development tools and software access.",
            "5. Meet your reporting manager and team members.",
            "6. Review internal policies and security compliance documents.",
            "",
            "IT Setup Includes:",
            "- Laptop allocation",
            "- VPN access",
            "- Company email credentials",
            "- Internal portal access",
            "- Project environment setup",
            "",
            "Employee Benefits:",
            "- Medical Insurance Coverage",
            "- Employee Wellness Programs",
            "- Learning and Development Opportunities",
            "- Internal Training Programs",
            "- Performance Recognition Programs",
            "- Career Growth Opportunities",
            "",
            "First Week Checklist:",
            "1. Meet your Reporting Manager",
            "2. Attend HR Orientation Session",
            "3. Complete System Access Setup",
            "4. Review Company Policies",
            "5. Join Team Introduction Meetings",
            "6. Complete Security Awareness Training",
            "",
            "Company Expectations:",
            "- Maintain professional conduct",
            "- Follow security and compliance guidelines",
            "- Collaborate effectively with team members",
            "- Continuously improve your technical and professional skills",
            "",
            "We are confident that your skills, dedication, and enthusiasm",
            "will contribute significantly to our organization's success.",
            "",
            "If you need any assistance, please contact the HR department.",
            "",
            "We wish you a successful and rewarding journey with Naxrita Solutions.",
            "",
            "Regards,",
            "",
            "Nambula Eswar Akash",
            "",
            "HR MANAGER",
            "",
            "+91 8341462856",
            "",
            "#1001, Silicon Towers, Silicon Valley Lane,",
            "Madhapur, Telangana - 500081"
        ]

        for line in lines:
            c.drawString(70, y, line)
            y -= 18

            if y < 60:
                c.showPage()
                y = height - 60
                c.setFont("Helvetica", 11)

        # Finalize and save the PDF after the loop finishes writing all text
        c.save()

        # Store PDF in MongoDB GridFS
        client = MongoClient("mongodb://localhost:27017")
        db = client["workflow_studio"]
        fs = GridFS(db)

        with open(file_path, "rb") as pdf_file:
            file_id = fs.put(
                pdf_file,
                filename=file_name
            )

        print("PDF Stored In MongoDB")
        print("File ID:", file_id)
        print(f"PDF generated: {file_path}")
        
        return file_path