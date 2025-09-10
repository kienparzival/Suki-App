# Supabase Authentication Setup Guide

## 🚀 Setting Up Supabase Email Confirmation

The Suki app now uses Supabase's built-in authentication system with email confirmation links instead of OTP codes!

### ✅ **What's Changed:**
- **Email Confirmation**: Users receive confirmation links via email
- **Magic Links**: Click the link to automatically sign in
- **Supabase Integration**: Uses your Supabase backend infrastructure
- **Social Auth**: Apple, Facebook, and Google sign-in ready

### 🔧 **Setup Steps:**

#### 1. **Create Supabase Project**
- Go to [https://supabase.com/](https://supabase.com/)
- Sign up/Login and create a new project
- Wait for the project to be ready

#### 2. **Get Your Credentials**
- In your Supabase dashboard, go to **Settings** → **API**
- Copy your **Project URL** and **anon public key**

#### 3. **Create Environment File**
Create a `.env` file in your project root:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### 4. **Configure Email Settings**
- Go to **Authentication** → **Settings** in Supabase
- Configure your email provider (or use Supabase's built-in email)
- Customize email templates if desired

#### 5. **Set Redirect URLs**
- Go to **Authentication** → **URL Configuration**
- Add your redirect URLs:
  - `http://localhost:5173/auth/callback` (development)
  - `https://yourdomain.com/auth/callback` (production)

### 📧 **How Email Confirmation Works:**

1. **User enters email** → Clicks "Send confirmation email"
2. **Supabase sends email** → With confirmation link
3. **User clicks link** → Redirected to `/auth/callback`
4. **Automatic sign-in** → User is authenticated and redirected to profile

### 🔐 **Social Authentication:**

The app supports:
- **Apple Sign-In**
- **Facebook Login**
- **Google Sign-In**

These will redirect to your Supabase project for authentication.

### 🧪 **Testing:**

1. **Start dev server**: `npm run dev`
2. **Go to** `/auth`
3. **Enter your email** → Click "Send confirmation email"
4. **Check your email** → Click the confirmation link
5. **Automatic redirect** → You'll be signed in!

### 🔒 **Security Features:**

- **Email Verification**: Users must confirm their email
- **Secure Tokens**: JWT tokens managed by Supabase
- **Session Management**: Automatic token refresh
- **User Metadata**: Stored securely in Supabase

### 🆘 **Troubleshooting:**

- **Email not received**: Check spam folder, verify Supabase email settings
- **Redirect errors**: Ensure callback URLs are configured correctly
- **Auth state issues**: Check browser console for errors

### 💡 **Production Notes:**

- **Custom Domain**: Update redirect URLs for your domain
- **Email Templates**: Customize confirmation emails in Supabase
- **Rate Limiting**: Supabase handles this automatically
- **Monitoring**: Use Supabase dashboard to monitor auth activity

Your authentication system is now production-ready with Supabase! 🎉 