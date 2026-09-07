from datetime import datetime
import os

from app.core.config import settings
from app.nodes.base import BaseNode
from gridfs import GridFS
from pymongo import MongoClient
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, Frame, HRFlowable, KeepTogether, ListFlowable, ListItem, PageTemplate, Paragraph, Spacer, Table, TableStyle


CHARCOAL = colors.HexColor("#25252D")
MUTED = colors.HexColor("#64646F")
PURPLE = colors.HexColor("#7C3AED")
LIGHT_GREY = colors.HexColor("#F3F4F6")
BORDER = colors.HexColor("#D1D5DB")


class NumberedCanvas(canvas.Canvas):
    """Adds a consistent border and page-total footer after document layout."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        page_count = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_page_chrome(page_count)
            super().showPage()
        super().save()

    def _draw_page_chrome(self, page_count):
        width, height = A4
        self.saveState()
        self.setStrokeColor(colors.HexColor("#A78BFA"))
        self.setLineWidth(0.65)
        self.roundRect(36, 36, width - 72, height - 72, 5, stroke=1, fill=0)
        self.setStrokeColor(BORDER)
        self.line(54, 52, width - 54, 52)
        self.setFillColor(MUTED)
        self.setFont("Helvetica", 8)
        self.drawString(54, 39, "NAXRITA SOLUTIONS PRIVATE LIMITED")
        self.drawCentredString(width / 2, 39, "Confidential – Employee Onboarding Document")
        self.drawRightString(width - 54, 39, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


class PdfNode(BaseNode):
    """Creates the existing onboarding PDF with a corporate presentation layer."""

    @staticmethod
    def _styles():
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle("CompanyName", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=CHARCOAL, alignment=TA_CENTER, spaceAfter=5))
        styles.add(ParagraphStyle("DocumentTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=PURPLE, alignment=TA_CENTER, spaceAfter=16))
        styles.add(ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=10, leading=15, textColor=CHARCOAL, spaceAfter=8))
        styles.add(ParagraphStyle("Section", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=CHARCOAL, spaceBefore=10, spaceAfter=5))
        styles.add(ParagraphStyle("Mission", parent=styles["BodyText"], fontName="Helvetica-Oblique", fontSize=10, leading=15, textColor=CHARCOAL, leftIndent=10, rightIndent=10, spaceAfter=4))
        styles.add(ParagraphStyle("TableLabel", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=9.25, leading=12, textColor=CHARCOAL))
        styles.add(ParagraphStyle("TableValue", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.25, leading=12, textColor=CHARCOAL))
        return styles

    @classmethod
    def _section(cls, title, content):
        styles = cls._styles()
        return KeepTogether([Paragraph(title.upper(), styles["Section"]), HRFlowable(width="100%", thickness=0.7, color=PURPLE, spaceAfter=7), content, Spacer(1, 4)])

    @classmethod
    def _list(cls, items, numbered=False):
        styles = cls._styles()
        return ListFlowable(
            [ListItem(Paragraph(item, styles["Body"]), leftIndent=6) for item in items],
            bulletType="1" if numbered else "bullet", start="1", leftIndent=20,
            bulletFontName="Helvetica-Bold", bulletFontSize=9.5, bulletColor=PURPLE, spaceAfter=2,
        )

    def _build_document(self, file_path, employee_name, employee_email, role, joining_date, workflow_name, pdf_title):
        """Builds the PDF file only; execute() retains the existing GridFS storage path."""
        styles = self._styles()
        document = BaseDocTemplate(file_path, pagesize=A4, leftMargin=0.75 * inch, rightMargin=0.75 * inch, topMargin=0.78 * inch, bottomMargin=0.95 * inch, title=pdf_title or "Employee Onboarding Welcome Letter", author="Naxrita Solutions Private Limited")
        document.addPageTemplates([PageTemplate(id="corporate", frames=[Frame(document.leftMargin, document.bottomMargin, document.width, document.height, id="content")])])
        generated_date = datetime.now().strftime("%d-%m-%Y")

        story = [
            Spacer(1, 4),
            Paragraph("NAXRITA SOLUTIONS PRIVATE LIMITED", styles["CompanyName"]),
            Paragraph("EMPLOYEE ONBOARDING / OFFER DOCUMENT", styles["DocumentTitle"]),
            HRFlowable(width="100%", thickness=1.2, color=PURPLE, spaceAfter=16),
            Paragraph(f"Dear {employee_name},", styles["Body"]),
            Paragraph("We are delighted to officially welcome you to Naxrita Solutions Private Limited.", styles["Body"]),
            Paragraph("At Naxrita, we specialize in delivering innovative enterprise software solutions, workflow automation platforms, scalable digital transformation services, and business process optimization technologies for modern businesses.", styles["Body"]),
            Paragraph(f"Your appointment as {role} marks the beginning of an exciting professional journey with our organization.", styles["Body"]),
            self._section("Our Mission", Paragraph("To empower organizations through automation, innovation, and digital excellence.", styles["Mission"])),
            self._section("Our Core Values", self._list(["Innovation", "Collaboration", "Integrity", "Continuous Learning", "Customer Excellence"])),
        ]

        information = [
            ("Employee Name", employee_name), ("Email", employee_email), ("Position", role),
            ("Joining Date", joining_date), ("Workflow", workflow_name), ("Generated Date", generated_date),
        ]
        table = Table([[Paragraph(label, styles["TableLabel"]), Paragraph(str(value or ""), styles["TableValue"])] for label, value in information], colWidths=[1.55 * inch, 4.15 * inch], hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY), ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        story.append(self._section("Employee Information", table))
        story.extend([
            self._section("Onboarding Instructions", self._list([
                "Complete all HR documentation.", "Attend the induction and orientation session.",
                "Configure your official company email.", "Setup required development tools and software access.",
                "Meet your reporting manager and team members.", "Review internal policies and security compliance documents.",
            ], numbered=True)),
            self._section("IT Setup Includes", self._list(["Laptop allocation", "VPN access", "Company email credentials", "Internal portal access", "Project environment setup"])),
            self._section("Employee Benefits", self._list(["Medical Insurance Coverage", "Employee Wellness Programs", "Learning and Development Opportunities", "Internal Training Programs", "Performance Recognition Programs", "Career Growth Opportunities"])),
            self._section("First Week Checklist", self._list(["Meet your Reporting Manager", "Attend HR Orientation Session", "Complete System Access Setup", "Review Company Policies", "Join Team Introduction Meetings", "Complete Security Awareness Training"], numbered=True)),
            self._section("Company Expectations", self._list(["Maintain professional conduct", "Follow security and compliance guidelines", "Collaborate effectively with team members", "Continuously improve your technical and professional skills"])),
            Spacer(1, 4),
            Paragraph("We are confident that your skills, dedication, and enthusiasm will contribute significantly to our organization's success.", styles["Body"]),
            Paragraph("If you need any assistance, please contact the HR department.", styles["Body"]),
            Paragraph("We wish you a successful and rewarding journey with Naxrita Solutions.", styles["Body"]),
            Spacer(1, 14),
            KeepTogether([
                Paragraph("Regards,", styles["Body"]), Spacer(1, 22),
                HRFlowable(width=2.2 * inch, thickness=0.6, color=CHARCOAL, spaceAfter=5, hAlign="LEFT"),
                Paragraph("Nambula Eswar Akash", styles["Body"]),
                Paragraph("HR Manager<br/>Naxrita Solutions Private Limited", styles["Body"]), Spacer(1, 5),
                Paragraph("Phone: +91 8341462856", styles["Body"]),
                Paragraph("Address: #1001, Silicon Towers, Silicon Valley Lane,<br/>Madhapur, Telangana - 500081", styles["Body"]),
            ]),
        ])
        document.build(story, canvasmaker=NumberedCanvas)

    def execute(self, employee_name, employee_email, role, joining_date, workflow_name, pdf_title):
        folder = "generated_pdfs"
        os.makedirs(folder, exist_ok=True)
        file_name = f"{pdf_title}_{employee_name}.pdf".replace(" ", "_")
        file_path = os.path.join(folder, file_name)
        self._build_document(file_path, employee_name, employee_email, role, joining_date, workflow_name, pdf_title)

        client = MongoClient(settings.MONGO_URI)
        db = client[settings.DB_NAME]
        fs = GridFS(db)
        with open(file_path, "rb") as pdf_file:
            file_id = fs.put(pdf_file, filename=file_name)
        print("PDF Stored In MongoDB")
        print("File ID:", file_id)
        print(f"PDF generated: {file_path}")
        return file_path

    async def compensate(self, context):
        pdf_path = context.get("pdf_path")
        if pdf_path and os.path.exists(pdf_path):
            os.remove(pdf_path)
            print(f"[SAGA] Deleted PDF : {pdf_path}")
        else:
            print("[SAGA] No PDF found to compensate.")
