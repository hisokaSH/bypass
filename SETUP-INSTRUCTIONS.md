# Vulcan Bypass License Portal - Setup Instructions

## Overview
This is a complete license key management system with a clean web UI and authentication. Users can log in, view their license keys, and validate them against your C++ application.

## Setup Steps

### 1. Database Setup

1. Go to your Supabase project dashboard at: https://0ec90b57d6e95fcbda19832f.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Open the file `supabase-setup.sql` in this project
4. Copy the entire contents and paste it into the SQL Editor
5. Click **Run** to create all tables, policies, and triggers

### 2. Deploy the Validation Edge Function

The validation API endpoint is already created at `supabase/functions/validate-key/index.ts`.

To deploy it:
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref 0ec90b57d6e95fcbda19832f`
4. Deploy the function: `supabase functions deploy validate-key`

### 3. Test the Web Portal

Your web portal is now ready! It includes:
- User registration and login
- Dashboard to view license keys
- Copy keys to clipboard
- View expiration dates and status
- Beautiful, production-ready UI

### 4. Create Test License Keys

To add test license keys for development:

1. Go to your Supabase dashboard
2. Navigate to **Table Editor** > **license_keys**
3. Click **Insert** > **Insert row**
4. Fill in:
   - user_id: (Get this from user_profiles table after creating an account)
   - key: Generate a key like `ABCD5-EFGH6-JKLM7-NPQR8`
   - status: `active`
   - expires_at: Set a future date like `2026-12-31`

Or run this SQL (replace USER_ID with actual user ID):

```sql
INSERT INTO license_keys (user_id, key, status, expires_at)
VALUES (
  'USER_ID_HERE',
  'ABCD5-EFGH6-JKLM7-NPQR8',
  'active',
  '2026-12-31'
);
```

### 5. Integrate with Your C++ Application

Check the `cpp-integration-example.cpp` file for complete integration code.

**Quick Start:**

1. Install HTTP library (libcurl recommended)
2. Install JSON library (nlohmann/json)
3. Update the API URL and anon key in the example
4. Copy the `validateLicenseKey()` function to your project
5. Call it when your app starts

**API Endpoint:**
```
POST https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/validate-key

Headers:
- Authorization: Bearer YOUR_ANON_KEY
- Content-Type: application/json

Body:
{
  "key": "ABCD5-EFGH6-JKLM7-NPQR8",
  "machine_id": "optional-hardware-id"
}

Response:
{
  "valid": true,
  "expires_at": "2026-12-31T00:00:00Z",
  "days_remaining": 365
}
```

## Features

### Web Portal
- Clean, modern dark theme UI
- User authentication (email/password)
- Dashboard showing all user's license keys
- Key status indicators (Active, Expired, Revoked)
- Days remaining counter
- Copy to clipboard functionality
- Machine binding display
- Mobile responsive

### License System
- Unique license keys
- Expiration dates
- Status tracking (active/expired/revoked)
- Machine binding (one key per device)
- Validation audit log
- IP address logging
- Automatic expiration handling

### Security
- Row Level Security (RLS) on all tables
- Users can only see their own keys
- Secure key validation
- Machine fingerprinting
- Audit logging of all validation attempts

## Next Steps

1. **Customize Branding**: Update colors, logos, and text in the components
2. **Add Payment Integration**: Consider Stripe for subscription payments
3. **Admin Panel**: Create an admin interface to manage users and keys
4. **Email Notifications**: Send emails when keys are about to expire
5. **Auto-renewal**: Implement subscription renewals

## Support

If you need help:
1. Check the Supabase documentation: https://supabase.com/docs
2. Review the code comments in each file
3. Test the API endpoint using Postman or curl

## File Structure

```
├── src/
│   ├── components/
│   │   ├── AuthForm.tsx        # Login/signup form
│   │   └── Dashboard.tsx       # Main dashboard with keys
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state
│   ├── hooks/
│   │   └── useLicenseKeys.ts   # Fetch license keys
│   ├── lib/
│   │   └── supabase.ts         # Supabase client setup
│   └── utils/
│       └── keyGenerator.ts     # Key utilities
├── supabase/
│   └── functions/
│       └── validate-key/
│           └── index.ts        # Validation API endpoint
├── supabase-setup.sql          # Database schema
└── cpp-integration-example.cpp # C++ integration guide
```