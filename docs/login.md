# Login

## Feature purpose
Use the login screen to authenticate into Workflow Studio and access the workflow builder or admin tools.

## Navigation path
- Open the application and go to /login.
- If no valid token is stored, the app redirects to the login page automatically.

## Step-by-step usage
1. Open the login screen.
2. Enter your email address.
3. Enter your password.
4. Click Login.
5. Wait for the app to validate the credentials and redirect to the dashboard.

## Required inputs
- Email
- Password

## Expected output
- A JWT token is stored in browser storage.
- The user is redirected to the main dashboard.
- A success or error message appears depending on the credentials.

## Common user questions
- Why was I redirected to login? The browser did not find a valid authentication token.
- What if I forgot my password? The current UI does not provide a self-service reset flow; an admin or the password change flow must be used.
- Can I log in as an admin? Yes, if the account role is Admin and the credentials are valid.
