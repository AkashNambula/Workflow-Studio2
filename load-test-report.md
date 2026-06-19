# Load Test Report

## Test Configuration

* Tool: Locust
* Users: 50
* Spawn Rate: 5 users/second
* Duration: 60 seconds
* Backend: FastAPI (Kubernetes)
* Host: http://localhost:8000

## Baseline Results

### Aggregate Metrics

| Metric         | Value |
| -------------- | ----- |
| Total Requests | 1406  |
| Failure Count  | 0     |
| Failure Rate   | 0.0%  |
| Requests/sec   | 24.02 |
| p50 Latency    | 17 ms |
| p95 Latency    | 48 ms |
| p99 Latency    | 94 ms |

### Endpoint Metrics

#### GET /workflows

* Requests: 674
* Failure Count: 0
* p50: 18 ms
* p95: 44 ms
* p99: 85 ms

#### GET /history

* Requests: 442
* Failure Count: 0
* p50: 14 ms
* p95: 37 ms
* p99: 72 ms

#### POST /run-workflow/sample

* Requests: 240
* Failure Count: 0
* p50: 17 ms
* p95: 41 ms
* p99: 66 ms

#### POST /login

* Requests: 50
* Failure Count: 0
* p50: 59 ms
* p95: 140 ms
* p99: 150 ms

## Redis Cache Analysis

The application was tested with Redis enabled.

GET /workflows achieved a p95 latency of 44 ms, which is well below the required threshold of 500 ms.

The cache significantly improved workflow retrieval performance and maintained stable response times under concurrent load.

## Conclusion

The application successfully handled 50 concurrent users with a 0% failure rate.

The p95 latency for GET /workflows remained below the required 500 ms threshold, indicating acceptable performance under load.
