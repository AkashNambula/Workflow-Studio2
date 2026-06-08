from app.nodes.email_node import EmailNode
from app.nodes.sms_node import SmsNode
from app.nodes.delay_node import DelayNode

print("Starting CLI workflow...\n")

email = EmailNode()
sms = SmsNode()
delay = DelayNode()

email.execute()
sms.execute()
delay.execute()

print("\nWorkflow completed")