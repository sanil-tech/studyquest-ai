You are an expert React + Base44 developer. 

Please fix the ChildLogin page in my StudyQuest Family System.

Current issue:
- Parent successfully creates a child account using createChildAccount.
- Child account is stored successfully in User entity.
- Example created account:
  username: "morry"
  password: "123456"
  app_role: "student"
  is_child_account: true
- However, when the child tries to login from ChildLogin page, the system cannot detect the username.

Goal:
Make ChildLogin work correctly with the existing Parent → Child account architecture.

Important:
DO NOT redesign the whole authentication system.
DO NOT change database schema.
DO NOT change createChildAccount function.
Only fix the ChildLogin page logic.

Required changes:

1. Login should support child username authentication.

The login flow should be:

User enters:
- Username
- Password

System should:
1. Search User entity by username.
2. Verify that app_role === "student".
3. Verify is_child_account === true.
4. Validate password.
5. Create login session/state.
6. Redirect to Student Dashboard.

Example query logic:

Find:
User.username === input username

Expected user record:

{
 username: "morry",
 app_role: "student",
 is_child_account: true,
 password_hash: "...",
 student_id: "SQ-XXXXXX"
}


2. Do NOT use parent authentication flow.

Avoid using:

base44.auth.login()

if it only supports email authentication.

Child login uses custom Student ID/username authentication.

Use the existing User entity.

3. Add proper debugging.

Add console logs temporarily:

console.log("Child login username:", username);
console.log("Found student:", student);


4. Handle errors clearly:

If username does not exist:

"Student account not found"

If password incorrect:

"Incorrect password"

If account is not a child account:

"This account is not a student account"


5. Maintain existing UI.

Keep:
- Existing design
- Existing Tailwind styling
- Existing animations
- Existing icons
- Existing routing

Only modify:
- login logic
- authentication checking
- error handling


6. Security:

Do not expose password_hash in UI.

Do not store plain password.

Use existing password verification method from the project if available.

If password hashing utility already exists, reuse it.

7. After successful login:

Store logged-in student information:

Example:

{
 id,
 full_name,
 username,
 student_id,
 app_role,
 is_child_account
}

Then redirect to:

/student-dashboard


Before modifying code:
First inspect:
- Current ChildLogin.jsx
- User entity schema
- Existing authentication utilities
- createChildAccount implementation

Then provide the complete corrected ChildLogin.jsx file.