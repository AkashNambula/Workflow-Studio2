# Workflow Studio

Workflow Studio is a full-stack HR automation platform for designing, saving, and running employee onboarding workflows. It combines a visual React Flow canvas with a FastAPI execution engine, MongoDB persistence, JWT authentication, role-based access control, and automation nodes for email, PDF generation, SMS, delay, and employee validation.

## Features

- Visual workflow builder with drag-and-drop nodes powered by React Flow
- JWT-based login and protected frontend routes
- Role-based access control for Admin, Operator, and Viewer users
- Admin user management for creating, listing, and deleting non-admin staff accounts
- Workflow persistence in MongoDB
- Workflow execution against employee onboarding data
- Execution logs displayed in the dashboard and stored in run history
- PDF welcome letter generation and GridFS storage
- Email delivery with optional generated PDF attachment
- SMS notification node using Fast2SMS-style API integration
- Light and dark dashboard themes
- Backend tests for workflow execution behavior and RBAC rules

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
- JWT authentication with `python-jose`
- Password hashing with Passlib and bcrypt
- SMTP email integration
- PDF generation with ReportLab
- GridFS for generated document storage

## Project Structure

```text
Workflow-Studio-main/
|-- backend/
|   |-- app/
|   |   |-- api/              # FastAPI route modules
|   |   |-- core/             # Config, security, logging helpers
|   |   |-- db/               # MongoDB connection
|   |   |-- engine/           # Workflow execution engine
|   |   |-- models/           # Pydantic models
|   |   |-- nodes/            # Workflow node implementations
|   |   |-- websocket/        # Live log websocket module
|   |   `-- main.py           # FastAPI application entry point
|   |-- generated_pdfs/       # Generated onboarding PDFs
|   |-- tests/                # Pytest test suite
|   `-- requirements.txt
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- App.jsx           # Workflow builder dashboard
|   |   |-- Login.jsx         # Login screen
|   |   |-- Register.jsx      # Legacy registration component
|   |   |-- UserManagement.jsx
|   |   `-- main.jsx
|   `-- package.json
`-- README.md
```

## Roles and Permissions

| Role | Capabilities |
| --- | --- |
| Admin | Manage users, create and save workflows, run workflows, view saved workflows, view execution history |
| Operator | Build and run workflows |
| Viewer | Protected dashboard access only, with workflow actions restricted |

## Backend Setup

1. Go to the backend directory:

```bash
cd backend
```

2. Create and activate a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

The code also imports `reportlab`, `requests`, and `gridfs` through the PDF and SMS nodes. If they are not already installed in your environment, install them:

```bash
pip install reportlab requests
```

4. Create a `.env` file inside `backend/`:

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=workflow_studio
JWT_SECRET=replace_with_a_strong_secret_key
```

5. Start MongoDB locally, then run the FastAPI server:

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

Health check:

```text
GET http://127.0.0.1:8000/health
```

## Frontend Setup

1. Go to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the Vite development server:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

The backend CORS configuration currently allows requests from `http://localhost:5173`.

## API Endpoints

### General

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Backend status message |
| GET | `/health` | Health check |
| GET | `/test-db` | Inserts a test document into MongoDB |

### Authentication and Admin Users

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/login` | Public | Authenticates a user and returns a JWT |
| POST | `/admin/create-user` | Admin | Creates an Operator or Viewer account |
| GET | `/admin/users` | Admin | Lists all users |
| DELETE | `/admin/user/{email}` | Admin | Deletes a non-admin user |

### Workflows

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/create-workflow` | Admin, Operator | Creates or updates a workflow by name |
| GET | `/workflows` | Admin, Operator | Returns all saved workflows |
| GET | `/workflow/{workflow_name}` | Admin, Operator | Returns one saved workflow |
| POST | `/run-workflow/{workflow_name}` | Admin, Operator | Runs a workflow for submitted employee data |
| GET | `/history` | Admin | Returns workflow execution history |

## Workflow Node Types

| Node | Purpose |
| --- | --- |
| Condition | Validates employee name, email, phone, role, and joining date before continuing |
| PDF | Generates an employee onboarding welcome letter PDF |
| Email | Sends an onboarding email and can attach the generated PDF |
| SMS | Sends an onboarding notification to the employee phone number |
| Delay | Pauses execution for a configured number of seconds |

## Running Tests

From the backend directory:

```bash
pytest
```

The current test suite includes workflow engine scenarios and RBAC permission checks.

## Important Configuration Notes

- Create an initial Admin user directly in MongoDB or through a seed script before using the admin dashboard.
- Store real email credentials, SMS API keys, and JWT secrets in environment variables before production use.
- `backend/app/nodes/email_node.py` currently contains hardcoded Gmail credentials and should be refactored to read from `.env`.
- `backend/app/nodes/sms_node.py` contains a placeholder Fast2SMS API key.
- `backend/app/nodes/pdf_node.py` currently connects directly to `mongodb://localhost:27017` and `workflow_studio`; this should be aligned with the central settings in `backend/app/core/config.py`.
- The frontend includes a legacy `Register.jsx` component and a change-password UI call, but the active backend routes expose admin-based user creation instead of public registration or `/change-password`.
- Generated PDFs and Python cache files should generally be excluded from source control in a production repository.

## Suggested Environment Variables

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=workflow_studio
JWT_SECRET=replace_with_a_strong_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@example.com
SMTP_APP_PASSWORD=your_app_password
FAST2SMS_API_KEY=your_sms_api_key
```

## Development Workflow

1. Start MongoDB.
2. Run the FastAPI backend on port `8000`.
3. Run the Vite frontend on port `5173`.
4. Login with an Admin account.
5. Create Operator or Viewer users from the User Management screen.
6. Build workflows on the canvas using available nodes.
7. Save and run workflows with employee onboarding details.
8. Review execution logs and admin history.

## License

No license file is currently included. Add a license before distributing or publishing this project.
