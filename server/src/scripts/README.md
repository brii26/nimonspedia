# Admin User Seeding

## Overview
This script seeds a default admin user into the database with bcrypt-hashed password.

## Default Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@nimonspedia.com`
- **Role**: `admin`

## Usage

### Option 1: Automatic (Docker - Recommended)
When you start the application with Docker Compose, the admin user is **automatically seeded** on first run:

```bash
docker-compose up --build
```

The seeding happens automatically in the Node.js container entrypoint before the server starts.

### Option 2: Using npm script (Manual)
```bash
cd server
npm run seed:admin
```

### Option 3: Direct execution (Manual)
```bash
cd server
node src/scripts/seedAdmin.js
```

## What it does
1. Checks if admin user already exists (by username)
2. If exists, skips seeding and shows message
3. If not exists:
   - Hashes the password using bcrypt (10 rounds)
   - Inserts admin user into `users` table
   - Displays success message with credentials

## Database Schema Required
The script expects the following columns in the `users` table:
- `user_id` (auto-increment primary key)
- `username` (unique)
- `email` (unique)
- `password` (text)
- `name` (text)
- `role` (text/enum)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Security Notes
- Password is hashed with bcrypt (10 salt rounds)
- **IMPORTANT**: Change the default password after first login in production!
- The plain password is only shown in console during seeding for development purposes

## Functions Added to UserRepository

### `seedAdminUser()`
Seeds the hardcoded admin user with bcrypt password hashing.

### `findByUsername(username)`
Finds a user by their username (needed for checking if admin exists).

### `deleteUserById(userId)`
Deletes a user by ID (useful for cleanup/testing).

## Example Output
```
Starting admin user seeding...

Admin user seeded successfully!
Username: admin
Password: admin123

✓ Admin seeding completed successfully!

=== Admin Credentials ===
Username: admin
Password: admin123
Email: admin@nimonspedia.com
=========================
```

## Troubleshooting

### Error: "relation 'users' does not exist"
Make sure your database migrations/init.sql have been run first.

### Error: "duplicate key value violates unique constraint"
Admin user already exists. The script will skip seeding automatically.

### Error: "Cannot find module 'bcryptjs'"
Run `npm install` in the server directory.
