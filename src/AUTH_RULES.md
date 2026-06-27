# StudyQuest Authentication Rules

## Overview
StudyQuest uses a **dual authentication system**:
1. **Standard Auth** (email/password or Google OAuth) - for Parents and Teachers
2. **Child Auth** (Student ID + Password/PIN) - for Students under 13

---

## Student Login Rules

### How Students Login
- **Route**: `/child-login` (accessible from main login page)
- **Credentials**: Student ID + Password OR 4-6 digit PIN
- **Student ID Format**: `SQ-XXXXXX` (e.g., `SQ-8F3K92`)

### Login Flow
1. Student enters Student ID and password/PIN on `/child-login`
2. System validates credentials against `User` entity
3. On success: session stored in localStorage, redirected to `/dashboard` or `/complete-profile`
4. Session persists for 7 days or until logout

### Security Features
- **Account Lockout**: After 5 failed attempts, account is temporarily locked
- **Failed Attempt Tracking**: Incremented on each failed login
- **Auto-Reset**: Failed attempts reset on successful login

---

## Creating Student Accounts

### Method 1: Parent Creates Child Account
**Route**: Parent Dashboard → "Add Child" button

**Required Fields**:
- Full Name (required, non-empty)
- Date of Birth (auto-calculates education level)
- Gender
- State
- Profile photo (optional)

**Auto-Generated**:
- Student ID (unique, format: SQ-XXXXXX)
- Password (8 characters, shown once to parent)
- Optional PIN (4-6 digits, for younger children)

**Parent Can**:
- Reset child's password anytime
- Reset/change child's PIN
- View child's Student ID
- Lock/unlock child's account

### Method 2: Student Self-Registration
**Route**: `/register` → Select "Student" role

**Required**:
- Email (for account recovery)
- Password
- Confirm Password

**Flow**:
1. Register with email/password
2. Verify OTP (if enabled)
3. Select "Student" role
4. Complete profile wizard
5. Auto-generates Student ID

---

## Authentication Context

### Session Management
- **Child Sessions**: Stored in localStorage (`studyquest_session`, `studyquest_user`)
- **Standard Sessions**: Managed by Base44 auth tokens
- **Session Validation**: On app load, verifies user still exists and isn't locked

### Protected Routes
All routes require authentication via `ProtectedRoute`:
- `/dashboard` - Student dashboard (requires profile completion)
- `/study/*` - Study pages
- `/quiz/*` - Quiz pages
- `/wallet` - Student wallet
- `/rewards` - Student rewards
- `/parent/*` - Parent dashboard (parent role only)

### Profile Completion Gate
After first login, ALL users must complete profile via `/complete-profile`:
- **Students**: Full name, DOB, education level, preferences
- **Parents**: Full name, phone, number of children
- **Teachers**: Full name, subjects taught, teaching level

---

## User Entity Fields

### Student-Specific Fields
```json
{
  "app_role": "student",
  "student_id": "SQ-8F3K92",
  "is_child_account": true,
  "password_hash": "...",
  "pin_hash": "...",
  "login_method": "password|pin|both",
  "failed_login_attempts": 0,
  "account_locked": false,
  "linked_parent_id": "parent-user-id",
  "profile_completed": false
}
```

### Parent-Specific Fields
```json
{
  "app_role": "parent",
  "linked_student_ids": ["child1-id", "child2-id"],
  "num_children": 2,
  "children_names": "Alice,Bob"
}
```

---

## Troubleshooting Student Login Issues

### "Incorrect Student ID"
**Cause**: No user with that Student ID exists
**Fix**: 
1. Parent should check child's Student ID in Parent Dashboard
2. Verify student is using uppercase (format: SQ-XXXXXX)

### "Incorrect details, please try again"
**Cause**: Wrong password/PIN
**Fix**:
1. Parent can reset credentials via Parent Dashboard → Child Profile → Credentials
2. Check if account is locked (5 failed attempts)

### "Account temporarily locked"
**Cause**: 5+ consecutive failed login attempts
**Fix**:
1. Parent must unlock via Parent Dashboard → Child Profile → Credentials
2. Or wait for automatic reset (if implemented)

### "This account requires parent login"
**Cause**: User is not marked as `is_child_account`
**Fix**: Use main login page `/login` instead

---

## Testing Student Login

### Create a Test Student Account
1. Login as parent (or create parent account)
2. Go to Parent Dashboard (`/parent`)
3. Click "Add Child"
4. Fill in required fields:
   - Full Name: "Test Student"
   - Date of Birth: Any date (e.g., 2015-01-01)
   - Gender: Any
   - State: Any
5. Submit → Note the generated Student ID and password
6. Logout
7. Go to `/child-login`
8. Enter Student ID and password
9. Should redirect to dashboard

### Verify Session Persistence
1. After successful login, check localStorage:
   - `studyquest_session` exists
   - `studyquest_user` contains user data
2. Refresh page → should stay logged in
3. Click logout → both localStorage items cleared

---

## Important Notes

1. **Never use "Unnamed Student"** - all students must have valid full names
2. **Profile completion is mandatory** - users can't access app features without completing onboarding
3. **Child accounts can't use email login** - must use Student ID + password/PIN
4. **Parents manage all child credentials** - children under 13 can't reset their own passwords
5. **Session validation on every app load** - checks user exists and isn't locked

---

## Quick Reference

| Feature | Route | Notes |
|---------|-------|-------|
| Child Login | `/child-login` | Student ID + password/PIN |
| Parent Login | `/login` | Email + password or Google |
| Student Dashboard | `/dashboard` | Requires profile completion |
| Parent Dashboard | `/parent` | Manage children, rewards, approvals |
| Add Child | Parent Dashboard → Add Child | Auto-generates Student ID + credentials |
| Reset Credentials | Parent Dashboard → Child Profile → Credentials | Parent-only action |
| Complete Profile | `/complete-profile` | Mandatory for all new users |