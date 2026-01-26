# Supabase Migration Setup Guide

Your quiz application has been successfully migrated from localStorage to Supabase! Follow these steps to complete the setup:

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Copy your **Project URL** and **Anon Key** from Settings → API

### 2. Configure Your Application
1. Open `supabase-config.js`
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';     // Replace with your project URL
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key
   ```

### 3. Set Up Database
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL schema from `supabase-config.js` (comments section)
4. Click **Run** to execute the schema
5. **IMPORTANT**: Also execute the RPC function from `assets/delete_user_rpc.sql` to enable complete account deletion

## 📋 What Was Migrated

### ✅ Completed Features
- **User Authentication**: Sign up/sign in with email/password
- **Quiz Storage**: All quizzes saved to Supabase database
- **Autosave**: Real-time autosave to Supabase
- **Multi-user Support**: Each user sees only their own quizzes
- **Data Persistence**: Quizzes accessible across devices
- **Row Level Security**: Secure data access per user
- **Complete Account Deletion**: Users can permanently delete their accounts and all data

### 🔄 Data Flow Changes

#### Before (localStorage):
```
localStorage → Browser Storage → Single Device
```

#### After (Supabase):
```
User Input → Supabase Auth → Database → All Devices
```

## 🔧 Technical Changes

### Files Modified:
- `supabase-config.js` - New configuration file
- `index.html` - Added Supabase scripts
- `script.js` - Updated to use Supabase functions
- `saved-quizzes.html` - Added Supabase scripts  
- `saved-quizzes.js` - Updated to use Supabase
- `test-runner.html` - Added Supabase scripts
- `test-runner.js` - Updated to use sessionStorage
- `welcome.html` - Added Supabase scripts
- `welcome.js` - Updated to use Supabase auth

### Key API Changes:
- `localStorage.getItem()` → `window.supabaseClient.loadXxxFromSupabase()`
- `localStorage.setItem()` → `window.supabaseClient.saveXxxToSupabase()`
- Added user authentication flows
- Added error handling for network operations

## 🎯 Next Steps

1. **Test the Application**:
   - Try creating a new user account
   - Create and save a quiz
   - Run the quiz
   - Check saved quizzes page

2. **Security Notes**:
   - Enable email confirmation in Supabase Auth settings
   - Configure CORS if needed
   - Review RLS policies in database

3. **Optional Enhancements**:
   - Add password reset functionality
   - Implement social login options
   - Add user profile management
   - Enable quiz sharing between users

## 🐛 Troubleshooting

### Common Issues:
- **CORS Errors**: Ensure your domain is added to Supabase CORS settings
- **Auth Failures**: Check that email confirmation is enabled
- **Database Errors**: Verify SQL schema was executed correctly
- **Permission Issues**: Check RLS policies are properly configured
- **Account Deletion Issues**: Make sure the RPC function from `delete_user_rpc.sql` was executed in SQL Editor

### Debug Mode:
Open browser console to see detailed Supabase operation logs and error messages.

---

**🎉 Your application is now ready for production use with Supabase!**

The migration preserves all existing functionality while adding cloud storage, user authentication, and multi-device support.
