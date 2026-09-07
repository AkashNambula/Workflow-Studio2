from locust import HttpUser, task, between, events


class WorkflowUser(HttpUser):
    # Fire requests continuously
    wait_time = between(0, 0)

    def on_start(self):
        response = self.client.post(
            "/login",
            json={
                "email": "prasad@gmail.com",
                "password": "prasad123"
            }
        )

        if response.status_code == 200:
            token = response.json()["token"]

            self.headers = {
                "Authorization": f"Bearer {token}"
            }
        else:
            self.headers = {}

    @task
    def run_workflow(self):
        self.client.post(
            "/run-workflow/NEW MAILS",
            json={
                "employees": [
                    {
                        "name": "Harshitha",
                        "email": "nambulaakash@gmail.com",
                        "phone": "9949101910",
                        "role": "AI/ML",
                        "joining_date": "2026-07-03"
                    }
                ]
            },
            headers=self.headers
        )


@events.quitting.add_listener
def check_threshold(environment, **kwargs):
    stats = environment.stats.get(
        "/run-workflow/NEW MAILS",
        "POST"
    )

    if stats and stats.num_requests > 0:
        print("\n==============================")
        print("Sprint 6 Deliverable 4 Report")
        print("==============================")
        print(f"Total Requests : {stats.num_requests}")
        print(f"Failures       : {stats.num_failures}")
        print(f"Average Time   : {stats.avg_response_time:.2f} ms")
        print(f"RPS            : {stats.total_rps:.2f}")
        print("==============================")