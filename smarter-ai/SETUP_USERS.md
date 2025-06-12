# Setting Up Users in the Database

This guide explains how to add users to your Smarter.ai application using Convex functions.

## Step 1: Add the Admin User

First, let's add an admin user with the following details:
- Name: Ali Reda
- Email: alireda@teloshouse.com
- Password: h1n1a1y1

You have two options for adding the admin user:

### Option 1: Using the Convex Dashboard

1. Go to your Convex dashboard
2. Navigate to the "Functions" tab
3. Find and run the `insertAdminUser` function from `insertSampleData.ts`
4. This will create a user record in the database

### Option 2: Using the Convex CLI

```bash
npx convex run insertSampleData:insertAdminUser
```

## Step 2: Sign Up Using the Admin Account

After inserting the admin user to the database, you need to complete the account setup:

1. Go to your application's login page
2. Click "Need an account? Sign up"
3. Enter the following details:
   - Email: alireda@teloshouse.com
   - Name: Ali Reda
   - Password: h1n1a1y1
   - Select the "Administrator" role
4. Complete the sign-up process

This will create the authentication credentials for the admin user.

## Step 3: Add Sample Candidates (Optional)

If you want to add sample candidate data:

### Using Convex Dashboard:
1. Go to your Convex dashboard
2. Navigate to the "Functions" tab
3. Find and run the `insertSampleCandidates` function from `insertSampleData.ts`

### Using Convex CLI:
```bash
npx convex run insertSampleData:insertSampleCandidates
```

## Step 4: Convert Candidates to Users

Once you have candidates in your database, you can convert them to users:

### Using Convex Dashboard:
1. Go to your Convex dashboard
2. Navigate to the "Functions" tab
3. Find and run the `convertCandidatesToUsers` function from `seedUsers.ts`

### Using Convex CLI:
```bash
npx convex run seedUsers:convertCandidatesToUsers
```

This will:
1. Create user accounts for all candidates in the database
2. Link candidates to their corresponding user accounts
3. Return a list of the operations performed

## Step 5: Verify the Setup

You can verify that the users have been correctly added:

### Using Convex Dashboard:
1. Go to your Convex dashboard
2. Navigate to the "Functions" tab
3. Find and run the `listUsers` function from `seedUsers.ts`

### Using Convex CLI:
```bash
npx convex run seedUsers:listUsers
```

To see candidates with their linked user information:
```bash
npx convex run seedUsers:listCandidatesWithUsers
```

## Important Notes

- Password authentication requires that users sign up through the UI
- For the converted candidate users, you'll need to set their passwords by going through the "forgot password" flow or signing up with the same email
- The admin user is set up with `completedOnboarding: true` so they can bypass the onboarding flow 