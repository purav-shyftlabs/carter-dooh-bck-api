# Database Setup Guide

This guide will help you set up the PostgreSQL database for the Carter DOOH application.

## Prerequisites

- PostgreSQL server installed and running
- Access to a PostgreSQL superuser account (usually `postgres`)

## Setup Steps

### Step 1: Create Database User and Database

First, run the `create-role.sql` file to create the database user and database:

```bash
# Connect to PostgreSQL as superuser and run the role creation script
psql -U postgres -f create-role.sql
```

**What this script does:**

- Creates a new PostgreSQL user `carter_dooh` with password `Carter2025`
- Creates a new database `carter_doooh` owned by the `carter_dooh` user
- Grants all necessary privileges to the user

### Step 2: Create Tables and Insert Initial Data

Next, run the `create-user.sql` file to create all tables and insert initial data:

```bash
# Connect to the new database and run the table creation script
psql -U carter_dooh -d carter_doooh -f create-user.sql
```

### Step 3: Default Admin Credentials

Use these credentials to log in after setup:

- Username: `carter@shyftlabs.io`
- Password: `Qwerty@123`
