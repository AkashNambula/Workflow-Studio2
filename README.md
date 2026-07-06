# Workflow Studio

Workflow Studio is a full-stack HR automation platform for designing, saving, and running employee onboarding workflows. It combines a React Flow-based visual builder with a FastAPI execution engine, MongoDB persistence, JWT authentication, role-based access control, Redis/Celery background workers, and real-time execution logging.

## Overview

Workflow Studio helps HR and operations teams automate onboarding processes such as employee validation, document generation, email delivery, SMS notifications, and delayed follow-ups. Users can visually design workflows, save them, run them against employee data, and monitor execution progress in real time.

## Why This Project Exists

This project demonstrates a practical end-to-end automation platform where:

- a frontend workflow canvas lets users create business logic visually,
- a backend engine executes the workflow steps reliably,
- MongoDB stores workflow definitions and run history,
- Celery and Redis handle asynchronous processing,
- and WebSockets provide live execution feedback.

## Key Features

- Visual workflow builder with drag-and-drop nodes powered by React Flow
- Role-based access control for Admin, Operator, and Viewer users
- Admin dashboard for creating and managing non-admin users
- Workflow persistence and retrieval from MongoDB
- Asynchronous workflow execution with Celery and Redis
- Real-time execution logs over WebSockets
- PDF generation for onboarding welcome letters
- Email and SMS notifications as workflow steps
- Delay and HTTP request nodes for more advanced automation flows
- Docker Compose deployment for local development and testing
- Kubernetes manifests for container-based deployment

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- React Flow
- Axios

### Backend

- FastAPI
- Uvicorn
- MongoDB with PyMongo
- Pydantic
- Python-JOSE for JWT authentication
- Passlib + bcrypt for password hashing
- Celery + Redis for asynchronous processing
- ReportLab for PDF generation
- SMTP integration for email delivery

## Architecture

```text
Frontend (React + Vite) -> FastAPI Backend -> MongoDB
                                  -> Celery Workers -> Redis
                                  -> WebSocket Logs
```

The backend exposes REST APIs for workflow management and execution, while Celery workers process long-running automation tasks in the background.

## Project Structure

```text
Workflow-Studio-main/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI route modules
│   │   ├── core/             # Config, security, cache, logging helpers
│   │   ├── db/               # MongoDB connection layer
│   │   ├── engine/           # Workflow execution engine
│   │   ├── models/           # Data models
│   │   ├── nodes/            # Workflow node implementations
│   │   ├── scheduler/        # Scheduler and leader election logic
│   │   ├── services/         # External service helpers
│   │   ├── websocket/        # Live log WebSocket routes
│   │   ├── worker/           # Celery worker configuration and tasks
│   │   └── main.py           # FastAPI application entry point
│   ├── generated_pdfs/       # Generated onboarding PDFs
│   ├── tests/                # Backend pytest suite
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx           # Main workflow builder dashboard
│   │   ├── Login.jsx         # Login screen
│   │   ├── Register.jsx      # Legacy registration UI
│   │   ├── UserManagement.jsx
│   │   └── main.jsx
│   └── package.json
├── k8s/                      # Kubernetes manifests
├── docker-compose.yml
└── README.md
```

## Roles and Permissions

| Role | Capabilities |
| --- | --- |
| Admin | Manage users, create and save workflows, run workflows, view saved workflows, and view execution history |
| Operator | Build and run workflows |
| Viewer | Access the dashboard with restricted workflow actions |

## Prerequisites

Before running the project locally, make sure you have:

- Python 3.10+ and pip
- Node.js 20+ and npm
- MongoDB running locally or via Docker
- Redis running locally or via Docker

## Quick Start with Docker Compose

The easiest way to run the full stack locally is with Docker Compose.

```bash
docker compose up --build
```

Once the containers are running:

- Frontend: http://localhost:4173
- Backend: http://localhost:8000/health
- Flower (Celery monitoring): http://localhost:5555

## Local Development Setup

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder:

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=workflow_studio
JWT_SECRET=replace_with_a_strong_secret_key
EMAIL_ADDRESS=your_email@example.com
EMAIL_PASSWORD=your_app_password
REDIS_HOST=localhost
REDIS_PORT=6379
```

Start MongoDB and Redis, then run:

```bash
uvicorn app.main:app --reload
```

For workflow execution workers, run a separate terminal:

```bash
celery -A app.worker.celery_app worker --loglevel=info --concurrency=2
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will be available at:

```text
http://localhost:5173
```

## API Highlights

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/login` | Authenticate a user and receive a JWT |
| POST | `/change-password` | Change a user password |
| POST | `/admin/create-user` | Create an Operator or Viewer account (Admin only) |
| GET | `/admin/users` | List all users (Admin only) |
| DELETE | `/admin/user/{email}` | Delete a non-admin account (Admin only) |

### Workflows

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/create-workflow` | Save or update a workflow by name |
| GET | `/workflows` | Retrieve all workflows |
| GET | `/workflow/{name}` | Retrieve a single workflow |
| POST | `/run-workflow/{workflow_name}` | Queue a workflow run for employee data |
| GET | `/history` | Retrieve workflow execution history |

### System

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Backend status message |
| GET | `/health` | Health check |
| GET | `/test-db` | Insert a test record into MongoDB |
| GET | `/redis-test` | Validate Redis connectivity |

## Workflow Node Types

| Node | Purpose |
| --- | --- |
| Condition | Validate employee details before continuing execution |
| PDF | Generate an onboarding welcome letter PDF |
| Email | Send onboarding emails and optionally attach generated PDFs |
| SMS | Send onboarding SMS notifications |
| Delay | Pause execution for a configured duration |
| HTTP | Call external HTTP endpoints during workflow execution |

## Testing

### Backend

```bash
cd backend
pytest
```

### Frontend E2E

```bash
cd frontend
npx playwright test
```

## Deployment Notes

- Docker Compose is available for local and test deployments.
- Kubernetes manifests are included in the `k8s/` folder.
- For production, replace placeholder credentials and secrets with real environment values.

## License

This repository does not currently include a license file. Add one before distributing or publishing the project publicly.
