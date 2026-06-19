from locust import HttpUser, task, between, events

class WorkflowUser(HttpUser):
    wait_time = between(1, 3)

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

    @task(3)
    def list_workflows(self):
        self.client.get(
            "/workflows",
            headers=self.headers
        )

    @task(2)
    def get_history(self):
        self.client.get(
            "/history",
            headers=self.headers
        )

    @task(1)
    def run_workflow(self):
        self.client.post(
            "/run-workflow/sample",
            json={
                "employees": [
                    {
                        "name": "Akash",
                        "email": "akash@test.com",
                        "phone": "9999999999",
                        "role": "Developer",
                        "joining_date": "2026-06-17"
                    }
                ]
            },
            headers=self.headers
        )


@events.quitting.add_listener
def check_threshold(environment, **kwargs):
    stats = environment.stats.get("/workflows", "GET")

    if stats.num_requests > 0:
        p95 = stats.get_response_time_percentile(0.95)

        print(f"\nGET /workflows p95 latency = {p95} ms")

        if p95 > 500:
            print("FAIL: p95 latency exceeded 500ms")
            environment.process_exit_code = 1
        else:
            print("PASS: p95 latency within threshold")
            environment.process_exit_code = 0