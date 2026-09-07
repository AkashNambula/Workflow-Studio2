# Account Settings

## Feature purpose
Manage the current account from the main workflow builder, including password updates and logout.

## Navigation path
- In the main builder, click My Account in the top-right corner.
- Choose Change Password or Logout from the dropdown menu.

## Step-by-step usage
1. Sign in to the application.
2. Click My Account in the top-right corner.
3. Select Change Password.
4. Enter the old password, new password, and confirm password.
5. Click Update Password.
6. Use Logout to end the current session.

## Required inputs
- Old password
- New password
- Confirm password

## Expected output
- The password is updated successfully when the old password is correct and the new password matches the confirmation.
- The user is logged out when Logout is used.

## Common user questions
- Why was my password change rejected? The old password may be incorrect or the new and confirmation values may not match.
- What happens after I log out? The authentication token and user data are removed from local storage, and the app redirects to login.
- Can I change my own password without being an admin? Yes, this feature is available from the account menu for the current signed-in user.
