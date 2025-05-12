-- Final Uruti Hub Internship Dashboard Database Schema Script
-- This script drops existing tables (if any) and creates the complete, final schema.
-- Use this on a new, empty database.

-- Drop existing tables in reverse order of dependency (or use CASCADE)
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS intern_tasks CASCADE;
DROP TABLE IF EXISTS interns CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
-- Stores authentication details and roles (admin/intern)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., 'admin', 'intern'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create interns table
-- Stores profile information for interns, linked to a user account
CREATE TABLE interns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, -- Link to user account
    name VARCHAR(255) NOT NULL, -- Missing in previous script
    phone VARCHAR(50), -- Missing in previous script
    referring_source VARCHAR(255), -- Missing in previous script
    internship_start DATE, -- Assuming these dates are still needed based on context
    internship_end DATE, -- Assuming these dates are still needed based on context
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
-- Stores details about the tasks that can be assigned
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE, -- Missing in previous script
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Who created/assigned the task (Admin user) - Missing in previous script
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create intern_tasks table
-- Links interns to tasks they are assigned, represents a single assignment
CREATE TABLE intern_tasks (
    id SERIAL PRIMARY KEY,
    intern_id INTEGER NOT NULL REFERENCES interns(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(intern_id, task_id), -- An intern cannot be assigned the exact same task twice
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Assuming these timestamps are desired
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP -- Assuming these timestamps are desired
);

-- Create submissions table
-- Stores each submission attempt for a specific intern_task assignment
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    intern_task_id INTEGER NOT NULL REFERENCES intern_tasks(id) ON DELETE CASCADE, -- Link to the specific assignment
    submission_link VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Review', -- e.g., 'Pending Review', 'Approved', 'Denied'
    feedback TEXT, -- Admin feedback for denied submissions
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP, -- When the admin reviewed it
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Which admin reviewed it
    comments TEXT -- Intern's comments on the submission (added during resubmissions feature)
    -- IMPORTANT: NO UNIQUE constraint on intern_task_id here to allow multiple submissions
);

-- Optional: Add CHECK constraint for the status field to enforce allowed values
-- This is good practice if your PostgreSQL version supports it well
-- ALTER TABLE submissions ADD CONSTRAINT check_status CHECK (status IN ('Pending Review', 'Approved', 'Denied'));

-- Optional: Create indexes for performance on frequently queried columns
CREATE INDEX idx_intern_tasks_intern_id ON intern_tasks(intern_id);
CREATE INDEX idx_intern_tasks_task_id ON intern_tasks(task_id);
-- Index on intern_task_id in submissions is useful for lookups
CREATE INDEX idx_submissions_intern_task_id ON submissions(intern_task_id);
-- Index on reviewed_by might be useful for admin reporting
CREATE INDEX idx_submissions_reviewed_by ON submissions(reviewed_by);
-- Index on status might be useful for fetching pending/approved/denied counts
CREATE INDEX idx_submissions_status ON submissions(status);


-- Execution Instructions:
-- 1. Save this script as a .sql file (e.g., final_schema.sql).
-- 2. Open your terminal and connect to your Render PostgreSQL database using the External Database URL:
--    psql YOUR_EXTERNAL_DATABASE_URL
--    (Replace YOUR_EXTERNAL_DATABASE_URL with the actual URL from Render)
-- 3. Once connected (you see the 'your_db_name=>' prompt), execute this script using the \i command:
--    \i /path/to/your/saved/final_schema.sql
--    (Replace /path/to/your/saved/final_schema.sql with the actual path to the file on your local machine)
-- 4. Watch the psql output carefully for any errors.
-- 5. After the schema script runs successfully, execute your seed script using the same method (\i seed.sql if it's a SQL file, or run your Node.js seed script locally pointing to the Render DB using the DATABASE_URL env var).
-- 6. Type \q to exit psql.
