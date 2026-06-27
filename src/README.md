# StudyQuest - App Rules & Login Guide

## 🎓 Student Login Credentials

**Test Account Created:**
- **Student ID**: `SQ-TEST01`
- **Password**: `test123`
- **PIN**: `1234`

### How Students Login:
1. Go to the Login page
2. Click "Child Login" button (with Graduation Cap icon)
3. Enter Student ID: `SQ-TEST01`
4. Choose login method:
   - **Password**: Enter `test123`
   - **PIN**: Enter `1234`
5. Click "Login 🎯"
6. You'll be redirected to your dashboard!

---

## 📋 App Rules

### For Students:
1. **Login**: Use your Student ID and password/PIN (given by your parent)
2. **Profile**: Complete your profile before accessing lessons
3. **Lessons**: Study subjects to earn coins and XP
4. **Quizzes**: Take quizzes after lessons to test your knowledge
5. **Rewards**: Spend coins on rewards your parent sets
6. **Streak**: Study daily to build your streak!

### For Parents:
1. **Dashboard**: Monitor your children's progress
2. **Add Children**: Create child accounts from Parent Dashboard
3. **Set Rewards**: Create rewards for your children to earn
4. **Approve Requests**: Review and approve reward requests
5. **Manage Credentials**: Reset passwords/PINs if forgotten

### For Teachers:
1. **Upload Textbooks**: Add learning materials for students
2. **Monitor Progress**: Track student performance
3. **Manage Subjects**: Organize learning content

---

## 🔐 Authentication System

### Child Accounts (Under 13):
- **No email required** for login
- **Student ID** + **Password/PIN** authentication
- **Parent-managed** credentials
- **Secure**: Account locks after 5 failed attempts
- **Session**: 7-day auto-login

### Parent/Teacher Accounts:
- **Email** + **Password** authentication
- **Google OAuth** supported
- **Standard Base44 auth**

---

## 🎮 Gamification System

### Coins:
- **Earn**: Complete lessons (+10), quizzes (+20-50 based on score)
- **Spend**: Request rewards from parent
- **Track**: View balance in Wallet page

### XP & Levels:
- **Earn XP**: Study sessions, quiz attempts
- **Level Up**: Gain levels as you accumulate XP
- **Track Progress**: See your level on dashboard

### Streaks:
- **Daily Streak**: Study every day to build streak
- **Badges**: Earn streak milestone badges
- **Don't Break**: Miss a day = streak resets!

---

## 📱 Navigation

### Student Routes:
- `/dashboard` - Main student dashboard
- `/study` - Browse subjects and topics
- `/wallet` - View coin balance and transactions
- `/rewards` - Browse and request rewards
- `/profile` - Edit profile and preferences

### Parent Routes:
- `/parent` - Parent dashboard
- `/parent/children` - Manage linked children
- `/parent/rewards` - Create rewards
- `/parent/approvals` - Approve reward requests

---

## 🛠️ Technical Notes

### Session Management:
- Child sessions stored in `localStorage`
- Keys: `studyquest_session`, `studyquest_user`
- Auto-expires after 7 days
- Cleared on logout

### Security:
- Passwords hashed with salt
- PINs hashed with salt
- Failed login tracking
- Auto-lock after 5 failed attempts

### Data Entities:
- **User**: Student/parent/teacher profiles
- **Wallet**: Coin balances
- **Progress**: XP, levels, streaks
- **Transaction**: Coin movement logs
- **Reward**: Parent-created rewards
- **RewardRequest**: Student reward requests
- **QuizAttempt**: Quiz scores and feedback
- **StudySession**: Learning history

---

## 🆘 Troubleshooting

### Student Can't Login:
1. **Check Student ID**: Must be exact format (e.g., SQ-TEST01)
2. **Check Password/PIN**: Case-sensitive for passwords
3. **Account Locked?**: Wait or ask parent to reset
4. **Profile Complete?**: Complete profile if prompted

### Parent Can't See Children:
1. **Link Established?**: Check Parent-Child relationships
2. **Refresh Page**: Pull down to refresh data
3. **Check Connection**: Ensure internet connection

### General Issues:
1. **Clear Cache**: Clear browser cache and try again
2. **Logout/Login**: Try logging out and back in
3. **Check Console**: Open browser console for errors

---

## 📞 Support

For technical issues or questions, contact Base44 support through the platform.