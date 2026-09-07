# User Management

## Feature purpose
Create, reset, and delete user accounts for the platform.

## Navigation path
- Sign in as an Admin user.
- Open the main builder and go to the User Management section.
- Use the Create / Manage Users button from the sidebar or navigate directly to /user-management.

## Step-by-step usage
1. Log in as an Admin.
2. Open User Management.
3. Fill in the form with a full name, corporate email, password, phone number, and role.
4. Click Register Staff to create a new account.
5. Review the user directory table.
6. Use Reset to change a user password.
7. Use Delete to remove a user account.

## Required inputs
- Full name
- Email address
- Password
- Phone number
- Role
- New password when resetting an account

## Expected output
- New users are created and listed in the directory.
- Password reset operations update the selected account.
- Deleted users are removed from the directory.

## Common user questions
- Can I create an Admin account? The backend prevents creating another admin user.
- Why is the Reset action unavailable? It is hidden for admin accounts because those accounts are protected.
- What roles can I assign? The current UI allows Operator and Viewer roles.
