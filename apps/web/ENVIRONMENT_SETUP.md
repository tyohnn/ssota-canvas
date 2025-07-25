# Environment Setup Guide

## Required Environment Variables

### Clerk Authentication
```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # Add this for webhook verification
```

### Supabase Database
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

## Setup Instructions

### 1. Clerk Setup
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select existing one
3. Copy the publishable key and secret key
4. Set up webhook endpoint:
   - Go to Webhooks section
   - Add endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Select events: `user.created`, `user.updated`, `user.deleted`
   - Copy the webhook secret

### 2. Supabase Setup
1. Go to [Supabase Dashboard](https://supabase.com/)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Run database migrations

### 3. Environment Variables
Create a `.env.local` file in the web app directory:
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=your_database_url
```

## Testing
1. Start the development server: `pnpm dev`
2. Visit `http://localhost:3000`
3. Try signing up/signing in
4. Check the database to verify user creation 