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
# Production Database
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@[host]:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development Database (for User Management Domain refactoring)
DEV_DATABASE_URL=postgresql://postgres:[password]@[host]:5432/development_db
DEV_DIRECT_URL=postgresql://postgres:[password]@[host]:5432/development_db
NEXT_PUBLIC_SUPABASE_URL_DEV=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key

# Environment
NODE_ENV=development
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
1. **Production Supabase**:
   - Go to [Supabase Dashboard](https://supabase.com/)
   - Create a new project for production
   - Go to Settings > Database
   - Copy the connection string and API keys

2. **Development Supabase** (for User Management Domain refactoring):
   - Create a separate Supabase project for development
   - Or create a separate database in your existing project
   - Copy the development connection string and API keys

3. **Environment Variables**:
   - Production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Development: `NEXT_PUBLIC_SUPABASE_URL_DEV`, `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV`, `SUPABASE_SERVICE_ROLE_KEY_DEV`

### 3. Environment Variables
Create a `.env.local` file in the web app directory:
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret

# Production Database & Supabase
DATABASE_URL=your_production_database_url
DIRECT_URL=your_production_direct_url
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development Database & Supabase (for User Management Domain refactoring)
DEV_DATABASE_URL=your_development_database_url
DEV_DIRECT_URL=your_development_direct_url
NEXT_PUBLIC_SUPABASE_URL_DEV=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key

# Environment
NODE_ENV=development
```

### 4. Development Database Setup
For the User Management Domain refactoring, you'll need a separate development database:

1. **Create Development Database**:
   ```bash
   # In Supabase Dashboard, create a new project for development
   # Or create a separate database in your existing project
   ```

2. **Run Development Migrations**:
   ```bash
   # Set NODE_ENV=development to use dev schema
   pnpm db:dev:generate    # Generate dev migrations
   pnpm db:dev:migrate     # Run dev migrations
   pnpm db:dev:push        # Push schema to dev DB (alternative to migrate)
   ```

3. **Development Schema**:
   - Uses `src/db/dev-schema.ts` (User Management Domain only)
   - Outputs to `drizzle-dev/` folder
   - Connects to `DEV_DATABASE_URL`
   - Automatically switches based on `NODE_ENV=development`

### 5. Development Workflow
```bash
# 1. Set development environment
export NODE_ENV=development

# 2. Generate and run migrations
pnpm db:dev:generate    # Generate dev migrations
pnpm db:dev:migrate     # Run dev migrations

# 3. Start development server (automatically uses dev DB)
pnpm dev                # NODE_ENV=development automatically set

# 4. Open database studio
pnpm db:dev:studio      # Opens dev database in browser
```

### 6. Environment-based Database Configuration
The system automatically switches between production and development databases based on `NODE_ENV`:

- **`NODE_ENV=development`**: Uses `dev-schema.ts` and `DEV_DATABASE_URL`
- **`NODE_ENV=production`** (or unset): Uses `schema.ts` and `DATABASE_URL`

The `index.ts` file automatically:
- Connects to the appropriate database
- Uses the correct schema (dev vs production)
- Exports the appropriate admin client

### 7. Environment Variables Summary
```bash
# Production (default)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development (when NODE_ENV=development)
DEV_DATABASE_URL=postgresql://...
DEV_DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL_DEV=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key

# Environment
NODE_ENV=development  # Switches to dev schema, DB, and Supabase
```

## Testing
1. Start the development server: `pnpm dev`
2. Visit `http://localhost:3000`
3. Try signing up/signing in
4. Check the database to verify user creation 