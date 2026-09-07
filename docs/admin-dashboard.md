# Admin Dashboard

## Feature purpose
Provide administrators with a centralized overview of platform usage, workflow counts, and recent system activity.

## Navigation path
- Sign in as an Admin user.
- Open the Dashboard entry from the account menu in the main workflow builder.
- The route /admin-dashboard is mapped in the frontend router.

## Step-by-step usage
1. Log in with an Admin account.
2. Open the admin dashboard.
3. Review the summary cards for total users, workflows, running runs, completed runs, and failed runs.
4. Use the left navigation to switch between Overview, Saved Workflows, Execution History, and Recent Runs.
5. Search or filter recent runs by workflow name and status.

## Required inputs
- Valid admin credentials
- Optional search term or status filter for recent runs

## Expected output
- A dashboard view with platform metrics and recent workflow activity.
- Admin navigation to related workflow and history screens.

## Common user questions
- Why am I redirected away from the dashboard? The frontend guards access so only Admin users can view the admin dashboard.
- What data is shown in the overview cards? The backend returns counts for users, workflows, and historical run states.
- How do I return to the workflow builder? The sidebar includes a Back to Workflow Studio action.
