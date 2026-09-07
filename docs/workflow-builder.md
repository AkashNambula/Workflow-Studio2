# Workflow Builder

## Feature purpose
Design, configure, save, and run HR onboarding workflows with a visual canvas.

## Navigation path
- After login, open the main dashboard at /dashboard or /.
- The builder appears in the main workspace canvas area.

## Step-by-step usage
1. Sign in to the application.
2. Open the Employee Details panel from the left sidebar.
3. Enter the workflow name and employee details such as name, email, phone, role, and joining date.
4. Expand Workflow Controls in the sidebar.
5. Drag workflow nodes such as Email, PDF, Delay, SMS, or Condition onto the canvas.
6. Connect nodes by drawing links between them.
7. Click a node to open the configuration panel.
8. Enter the node-specific values, such as an email address, delay duration, SMS message, or PDF title.
9. Save the workflow when all nodes are connected and the required values are supplied.
10. Run the workflow to start execution and monitor the live execution log.

## Required inputs
- Workflow name
- Employee name
- Employee email
- Employee phone
- Optional role and joining date
- Node-specific values depending on the selected node type

## Expected output
- The workflow is saved to the backend.
- The workflow run is queued and started.
- Live execution logs appear in the canvas area.
- Nodes change visual state to reflect success, failure, or running status.

## Common user questions
- Why is Save Workflow disabled? The workflow contains one or more disconnected nodes, which the UI flags as orphaned.
- What is the Condition node for? It acts as a validation routing step for the workflow.
- Can I export my workflow? Yes. The canvas includes an Export button that downloads the workflow as a JSON file.
- What happens if I clear the canvas? All workflow nodes and edges are removed from the current workspace.
