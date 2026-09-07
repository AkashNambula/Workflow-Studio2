# Registration

## Feature purpose
Create a new user account for the platform.

## Navigation path
- The registration form is implemented in the frontend source as a dedicated page.
- In the current routing setup, it is not linked from the main app navigation, but it can be accessed directly at /register if the route is enabled in the frontend shell.

## Step-by-step usage
1. Open the registration form.
2. Enter the full name.
3. Enter a valid Gmail address.
4. Enter a 10-digit phone number.
5. Enter a password of at least 6 characters.
6. Confirm the password.
7. Choose a role such as Operator or Viewer.
8. Click Register.

## Required inputs
- Full name
- Email address
- Phone number
- Password
- Confirm password
- Role

## Expected output
- The account is created and the user is redirected to the login page.
- A success or error message is shown based on validation or backend response.

## Common user questions
- Why does the form require a Gmail address? The current implementation validates email input specifically for Gmail addresses.
- Why is my phone number rejected? The field only accepts 10 numeric digits.
- Why am I not seeing the register page in the app? The main router currently focuses on login and dashboard routes; registration is present as a component but not actively linked in the current navigation flow.
