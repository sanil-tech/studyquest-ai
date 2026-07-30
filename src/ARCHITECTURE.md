# StudyQuest Family System - Architecture Documentation

## Overview
A clean, scalable EdTech architecture supporting parent-child learning accounts with secure authentication without email/phone dependency for children under 13.

---

## Core System Principle

**Parent Creates Child → Auto-Link** (Primary Flow)
- Parents create child accounts directly through their dashboard
- Parent-child relationship is automatically established at registration
- Student ID + Password/PIN authentication (no email required)

**Connect Parent** (Edge Case Only)
- Used only for existing student accounts (13+ years)
- Student must approve parent connection requests

---

## Database Schema

### USERS TABLE (Unified Identity)
All users (parent, student, teacher) stored in single entity.

**Core Fields:**
- `id` (UUID, PK) - Base44 auto-generated
- `app_role` (parent | student | teacher)
- `full_name`, `email`, `password_hash`
- `created_date`, `updated_date`, `created_by_id` (Base44 built-ins)

**Student-Specific:**
- `student_id` (unique, e.g., SQ-8F3K92) - Auto-generated
- `username` (optional, e.g., emma.tan)
- `password_hash` - For Student ID + Password login
- `pin_hash` - For Student ID + PIN login (ages 4-8)
- `pin_enabled` (boolean)
- `login_method` (password | pin | both)
- `failed_login_attempts`, `account_locked`, `last_login_at`
- `is_child_account` (boolean)
- `date_of_birth`, `age`, `gender`
- `education_level`, `grade_year`, `class_name`, `school_name`
- `linked_parent_id` - Primary parent reference

**Parent-Specific:**
- `linked_student_ids` (array) - Children references
- `num_children`, `children_names`

**Profile Fields:**
- `nickname`, `avatar_emoji`, `avatar_photo_url`, `profile_picture_url`
- `country`, `state`, `phone_number`
- `profile_completed` (boolean)
- `notification_preferences` (object)
- `learning_preferences` (object)

---

### PARENT_CHILD_RELATIONSHIPS TABLE
Defines parent-child connections.

**Fields:**
- `id` (UUID, PK)
- `parent_id` (FK → User.id)
- `child_id` (FK → User.id)
- `relationship` (parent | guardian | other)
- `status` (pending | active | inactive)
- `linked_at` (timestamp)

**Rules:**
- One parent → multiple children ✓
- One child → multiple parents ✓
- Duplicate relationships prevented ✓

---

### LINK_REQUESTS TABLE (Edge Case)
Parent connection requests for existing students.

**Fields:**
- `id` (UUID, PK)
- `student_id`, `student_name`, `student_email`
- `parent_id`, `parent_name`, `parent_email`
- `initiated_by` (student | parent)
- `status` (pending | approved | rejected)

---

### PARENT_LINK_CODES TABLE
Time-sensitive codes for parent linking.

**Fields:**
- `id` (UUID, PK)
- `child_id` (FK → User.id)
- `code` (6-8 char alphanumeric)
- `expires_at` (24 hours from creation)
- `used_at`, `used_by_parent_id`
- `is_active` (boolean)

---

### SUPPORTING ENTITIES

**Wallet** - Student coin balance
- `student_id`, `balance`

**Progress** - Learning metrics
- `student_id`, `total_xp`, `level`, `streak_days`, `total_study_time`, `last_study_date`

**Transaction** - Coin movement log
- `student_id`, `type` (earn|spend), `amount`, `reason`, `reference_id`

**Quiz, QuizAttempt, StudySession, Reward, RewardRequest, Notification** - Learning & reward system

---

## Backend Functions

### 1. Create Child Account (Primary Flow)
**Function:** `createChildAccount`

**Request:**
```json
{
  "childData": {
    "full_name": "Ahmad bin Abu",
    "date_of_birth": "2015-03-15",
    "education_level": "Standard 3",
    "school_name": "SK Taman Jaya",
    "gender": "male",
    "state": "Selangor",
    "profile_picture_url": "..."
  }
}
```

**System Actions:**
1. Verify parent authentication
2. Generate unique Student ID (SQ-XXXXXX)
3. Generate secure password (10 chars)
4. Calculate age from DOB
5. Create User record with `is_child_account: true`
6. Create ParentChildRelationship (status: active)
7. Create Wallet (balance: 0)
8. Create Progress (level: 1, xp: 0)
9. Update parent's `linked_student_ids`

**Response:**
```json
{
  "success": true,
  "child": {
    "id": "...",
    "full_name": "Ahmad bin Abu",
    "student_id": "SQ-8F3K92",
    "username": "ahmad.abu",
    "password": "Ab2@9kLm3p",
    "pin_enabled": false
  },
  "message": "Child account created. Password shown only once!"
}
```

---

### 2. Child Login
**Function:** `childLogin`

**Request:**
```json
{
  "student_id": "SQ-8F3K92",
  "password": "Ab2@9kLm3p"
}
// OR
{
  "student_id": "SQ-8F3K92",
  "pin": "1234"
}
```

**Flow:**
1. Find user by student_id
2. Check account lock status
3. Validate credentials (password or PIN)
4. Track failed attempts (lock after 5)
5. Update last_login_at on success
6. Return user info

**Security:**
- Password/PIN hashed (custom salt + base64)
- Failed attempt tracking
- Account lockout after 5 failures
- Reset on successful login

---

### 3. Reset Child Credentials
**Function:** `resetChildCredentials`

**Actions:**
- `reset_password` - Generate new password
- `reset_pin` - Set new 4-6 digit PIN
- `enable_pin` - Enable PIN login
- `disable_pin` - Disable PIN login
- `unlock_account` - Reset failed attempts

**Authorization:** Parent with active relationship only

---

### 4. Link Parent to Child
**Function:** `linkParentToChild`

**Methods:**
- `student_id` - Send link request (edge case)
- `link_code` - Instant link via QR code

**Flow (Link Code):**
1. Validate code (active, not expired)
2. Create ParentChildRelationship
3. Mark code as used
4. Update parent's linked_student_ids
5. Notify child

---

### 5. Remove Parent-Child Link
**Function:** `removeParentChildLink`

**Important:**
- Only removes relationship record
- Does NOT delete child account
- Does NOT delete progress/wallet
- Notifies child

---

### 6. Approve Link Request
**Function:** `approveLinkRequest`

**Actions:** `approve` | `reject`

**Flow (Approve):**
1. Create ParentChildRelationship
2. Update link request status
3. Notify parent

---

### 7. Generate Student ID
**Function:** `generateStudentId`

**Format:** SQ-XXXXXX (6 alphanumeric, excludes I,O,0,1)
**Uniqueness:** Checked against existing users

---

### 8. Generate Parent Link Code
**Function:** `generateParentLinkCode`

**Format:** 6-8 char alphanumeric
**Expiry:** 24 hours
**Usage:** Single-use only

---

## API Endpoints Summary

| Function | Method | Purpose |
|----------|--------|---------|
| `createChildAccount` | POST | Parent creates child + auto-link |
| `childLogin` | POST | Student ID + Password/PIN auth |
| `resetChildCredentials` | POST | Parent resets child credentials |
| `linkParentToChild` | POST | Link via student_id or code |
| `removeParentChildLink` | POST | Remove relationship only |
| `approveLinkRequest` | POST | Student approves/rejects parent |
| `generateStudentId` | POST | Generate unique ID |
| `generateParentLinkCode` | POST | Generate time-sensitive code |

---

## Security Features

### Authentication
- ✅ Password hashing (salt + base64)
- ✅ PIN hashing (salt + base64)
- ✅ Failed attempt tracking
- ✅ Account lockout (5 attempts)
- ✅ Auto-unlock on successful login
- ✅ Last login timestamp

### Authorization
- ✅ Parent-only credential management
- ✅ Relationship verification before actions
- ✅ Role-based access control
- ✅ Service role for admin operations

### Data Protection
- ✅ Passwords shown once at creation
- ✅ PINs never stored in plain text
- ✅ Student IDs immutable
- ✅ No email/phone for under-13s

---

## User Experience Flows

### Parent Flow (Primary)
1. Parent registers → completes profile
2. Clicks "Add Child" on dashboard
3. Fills child profile form
4. System creates account + generates credentials
5. Parent saves credentials (PDF download/print)
6. Child immediately visible in dashboard
7. Child logs in via `/child-login` with Student ID + Password/PIN

### Student Flow (13+ Independent)
1. Student self-registers via `/register`
2. Completes profile → gets Student ID
3. Can optionally generate Parent Link Code
4. Parent uses code to link (no approval needed)
5. OR parent sends request → student approves

### Edge Case Flow (Existing Student)
1. Parent enters student's Student ID
2. System creates LinkRequest (pending)
3. Student receives notification
4. Student approves via ConnectParent component
5. Relationship created → parent dashboard updated

---

## Scalability Considerations

### Current Implementation
- ✅ Unified user table (no role-specific tables)
- ✅ Relationship-based parent-child linking
- ✅ Service role for cross-user operations
- ✅ Entity subscriptions for real-time updates

### Future Extensions
- School accounts (teacher → class → students)
- Multi-parent support (already supported)
- Classroom features (teacher dashboard)
- School-wide analytics
- Bulk student import

---

## Design Principles

1. **Parent-Created Accounts** - Primary flow for under-13s
2. **No Email Dependency** - Student ID + Password/PIN only
3. **Secure by Default** - Hashing, lockout, one-time passwords
4. **Relationship-Based** - Clean separation of identity and links
5. **Preserve Progress** - Removing links doesn't delete data
6. **Minimal Data** - Only essential fields for core functionality
7. **Extensible** - Easy to add school/classroom features

---

## Files Reference

### Backend Functions (`/functions`)
- `createChildAccount.js` - Primary child creation
- `childLogin.js` - Student authentication
- `resetChildCredentials.js` - Credential management
- `linkParentToChild.js` - Parent linking
- `removeParentChildLink.js` - Remove relationship
- `approveLinkRequest.js` - Approve/reject requests
- `generateStudentId.js` - ID generation
- `generateParentLinkCode.js` - Link code generation

### Entities (`/entities`)
- `User.json` - Unified user schema
- `ParentChildRelationship.json` - Parent-child links
- `LinkRequest.json` - Connection requests
- `ParentLinkCode.json` - Time-sensitive codes
- `Wallet.json`, `Progress.json` - Student data
- `Transaction.json` - Coin movement log

### Frontend Components
- `pages/ChildLogin.jsx` - Student login page
- `pages/ParentDashboard.jsx` - Parent overview
- `components/parent/AddChildModal.jsx` - Child creation
- `components/parent/CredentialsSummary.jsx` - Credential display
- `components/parent/ChildCredentialManager.jsx` - Management UI
- `components/student/ConnectParent.jsx` - Link approval

---

**Version:** 1.0  
**Last Updated:** 2026-06-27  
**Status:** Production Ready ✓