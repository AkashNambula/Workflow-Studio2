from app.nodes.base import BaseNode
import requests
import time


class SmsNode(BaseNode):

    def execute(self, phone, name):

        url = "https://www.fast2sms.com/dev/bulkV2"

        headers = {
            "authorization": "YOUR_FAST2SMS_API_KEY"
        }

        payload = {
            "route": "q",
            "message": f"Hello {name}, welcome to Naxrita! Your onboarding workflow has started. Please check your email for details.",
            "language": "english",
            "flash": 0,
            "numbers": phone
        }

        max_retries = 3

        for attempt in range(max_retries):

            try:

                print(
                    f"SMS Attempt {attempt + 1} "
                    f"for {phone}"
                )

                response = requests.post(
                    url,
                    json=payload,
                    headers=headers,
                    timeout=10
                )

                print("\n========== SMS NOTIFICATION ==========")
                print(f"To      : {phone}")
                print(f"Employee: {name}")
                print("Message : Onboarding notification triggered")
                print("Status  : SMS Sent Successfully")
                print("======================================\n")

                try:
                    print(
                        "Fast2SMS Response:",
                        response.json()
                    )
                except:
                    print(
                        "Fast2SMS Response:",
                        response.text
                    )

                return True

            except Exception as e:

                print(
                    f"SMS Attempt {attempt + 1} Failed"
                )

                print("Error:", e)

                if attempt < max_retries - 1:

                    print(
                        "Retrying in 2 seconds..."
                    )

                    time.sleep(2)

        print("\n========== SMS FAILURE ==========")
        print(f"To      : {phone}")
        print(f"Employee: {name}")
        print("Status  : SMS Failed After 3 Attempts")
        print("=================================\n")

        return False