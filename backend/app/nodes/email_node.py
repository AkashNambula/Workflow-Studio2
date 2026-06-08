from app.nodes.base import BaseNode
import smtplib
import os
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication


class EmailNode(BaseNode):
    def execute(
        self,
        receiver_email,
        name,
        role,
        joining_date,
        subject,
        message,
        pdf_path=None
    ):

        sender_email = "nambulaeswar2@gmail.com"
        app_password = "krff ousx ppqp ulse"

        body = f"""
Hi {name},

{message}

Employee Details:
Name: {name}
Email: {receiver_email}
Role: {role}
Joining Date: {joining_date}

Best Regards,
HR Team
Naxrita Solutions Private Limited
"""

        msg = MIMEMultipart()
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = receiver_email

        msg.attach(MIMEText(body, "plain"))

        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, "rb") as file:
                attachment = MIMEApplication(
                    file.read(),
                    _subtype="pdf"
                )

                attachment.add_header(
                    "Content-Disposition",
                    "attachment",
                    filename=os.path.basename(pdf_path)
                )

                msg.attach(attachment)

        max_retries = 3

        for attempt in range(max_retries):

            try:

                print(
                    f"Email Attempt {attempt + 1} "
                    f"for {receiver_email}"
                )

                server = smtplib.SMTP(
                    "smtp.gmail.com",
                    587
                )

                server.starttls()

                server.login(
                    sender_email,
                    app_password
                )

                server.sendmail(
                    sender_email,
                    receiver_email,
                    msg.as_string()
                )

                server.quit()

                print(
                    f"Email sent successfully to "
                    f"{receiver_email}"
                )

                return True

            except Exception as e:

                print(
                    f"Email Attempt {attempt + 1} Failed"
                )

                print("Error:", e)

                if attempt < max_retries - 1:

                    print(
                        "Retrying in 2 seconds..."
                    )

                    time.sleep(2)

        print(
            f"Email failed after "
            f"{max_retries} attempts"
        )

        return False