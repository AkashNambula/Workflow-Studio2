from app.nodes.base import BaseNode
import time


class DelayNode(BaseNode):
    def execute(self, seconds=5):
        print(f"Waiting for {seconds} seconds...")
        time.sleep(seconds)
        print("Delay completed")