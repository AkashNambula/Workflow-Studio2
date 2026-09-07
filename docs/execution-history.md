# Execution History

## Feature purpose
Review the execution history of workflow runs and their status over time.

## Navigation path
- From the main builder, open the Execution History section in the sidebar for admin users.
- The admin dashboard also exposes this view.
- The route /execution-history is also supported by the frontend router.

## Step-by-step usage
1. Sign in with an account that has access to workflow history.
2. Open the Execution History view.
3. Use the search box to find a workflow by name.
4. Use the status filter to view only Success, Running, or Failed runs.
5. Review the displayed history items and their completion times.
6. Click View Details if available in the UI flow.

## Required inputs
- No explicit form inputs are required.
- Search term and optional status filter can be used for narrowing results.

## Expected output
- A list of workflow runs appears with workflow name, employee reference, status, and completion time.
- Empty-state messaging appears when no history exists yet.

## Common user questions
- Why is the history empty? No workflow runs have been recorded yet.
- Can I filter by status? Yes, the page provides status filtering.
- Why do I not see details? The current implementation primarily surfaces summary information and routes back to the dashboard instead of opening a deeper detail panel.
