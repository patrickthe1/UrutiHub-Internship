-- Seed Script for Uruti Hub Internship Dashboard
-- This script populates the database with realistic test data
-- Execute after the schema has been created

-- Clear any existing data (if needed, uncomment these)
-- TRUNCATE submissions CASCADE;
-- TRUNCATE intern_tasks CASCADE;
-- TRUNCATE tasks CASCADE;
-- TRUNCATE interns CASCADE;
-- TRUNCATE users CASCADE;

-- Insert users: 1 admin and 5 intern users
-- Note: password_hash is bcrypt hash of 'password123' with 10 salt rounds
INSERT INTO users (email, password_hash, role) VALUES 
('admin@urutihub.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9BFzEcT0lGn8aEJv75bONodPFCPnkEu', 'admin'), -- password: password123
('john.doe@gmail.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9BFzEcT0lGn8aEJv75bONodPFCPnkEu', 'intern'), -- password: password123
('jane.smith@gmail.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9BFzEcT0lGn8aEJv75bONodPFCPnkEu', 'intern'), -- password: password123
('alex.johnson@gmail.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9BFzEcT0lGn8aEJv75bONodPFCPnkEu', 'intern'), -- password: password123
('maria.garcia@gmail.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9BFzEcT0lGn8aEJv75bONodPFCPnkEu', 'intern'), -- password: password123
('david.lee@gmail.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9BFzEcT0lGn8aEJv75bONodPFCPnkEu', 'intern'); -- password: password123

-- Insert intern profiles for each intern user
INSERT INTO interns (user_id, name, phone, referring_source, internship_start, internship_end) VALUES
(2, 'John Doe', '555-123-4567', 'University Career Fair', '2023-06-01', '2023-12-01'),
(3, 'Jane Smith', '555-234-5678', 'LinkedIn', '2023-07-15', '2024-01-15'),
(4, 'Alex Johnson', '555-345-6789', 'Employee Referral', '2023-09-01', '2024-03-01'),
(5, 'Maria Garcia', '555-456-7890', 'Company Website', '2023-10-15', '2024-04-15'),
(6, 'David Lee', '555-567-8901', 'Campus Recruitment', '2023-11-01', '2024-05-01');

-- Insert tasks (assigned by admin)
INSERT INTO tasks (title, description, due_date, assigned_by) VALUES
('Frontend Setup', 'Set up the React project structure and install necessary dependencies.', '2023-06-15', 1),
('User Authentication', 'Implement user login and authentication system with JWT.', '2023-07-01', 1),
('Database Schema Design', 'Design and implement the PostgreSQL database schema.', '2023-07-15', 1),
('Admin Dashboard', 'Create the admin dashboard UI with charts for data visualization.', '2023-08-01', 1),
('API Development', 'Develop RESTful API endpoints for the application.', '2023-08-15', 1),
('Unit Testing', 'Write comprehensive unit tests for backend functionality.', '2023-09-01', 1),
('Responsive Design', 'Ensure the application is responsive on mobile devices.', '2023-09-15', 1),
('Documentation', 'Create comprehensive API and user documentation.', '2023-10-01', 1);

-- Assign tasks to interns (intern_tasks)
-- John has all tasks assigned
INSERT INTO intern_tasks (intern_id, task_id) VALUES
(1, 1), -- John - Frontend Setup
(1, 2), -- John - User Authentication
(1, 3), -- John - Database Schema Design
(2, 1), -- Jane - Frontend Setup
(2, 4), -- Jane - Admin Dashboard
(2, 7), -- Jane - Responsive Design
(3, 2), -- Alex - User Authentication
(3, 5), -- Alex - API Development
(4, 3), -- Maria - Database Schema Design
(4, 6), -- Maria - Unit Testing
(4, 8), -- Maria - Documentation
(5, 4), -- David - Admin Dashboard
(5, 5); -- David - API Development

-- Insert submissions with various statuses
-- John: has multiple submissions for some tasks, with different statuses
INSERT INTO submissions (intern_task_id, submission_link, status, feedback, submitted_at, reviewed_at, reviewed_by, comments) VALUES
-- John's submissions (some with resubmissions)
(1, 'https://github.com/johndoe/frontend-setup', 'Approved', 'Great work!', '2023-06-10 10:30:00', '2023-06-11 14:20:00', 1, 'Initial submission with basic setup'),
(2, 'https://github.com/johndoe/auth-system-v1', 'Denied', 'Missing password reset functionality', '2023-06-25 09:15:00', '2023-06-26 11:45:00', 1, 'First attempt at authentication'),
(2, 'https://github.com/johndoe/auth-system-v2', 'Approved', 'Much better implementation with all required features', '2023-06-28 14:20:00', '2023-06-29 10:30:00', 1, 'Added password reset as requested'),
(3, 'https://github.com/johndoe/db-schema', 'Pending Review', NULL, '2023-07-14 16:45:00', NULL, NULL, 'Created database schema with all required tables'),

-- Jane's submissions
(4, 'https://github.com/janesmith/frontend-setup', 'Approved', 'Excellent work with good organization', '2023-06-12 11:20:00', '2023-06-13 09:30:00', 1, 'Created React project with component structure'),
(5, 'https://github.com/janesmith/admin-dashboard', 'Denied', 'Charts are not displaying data correctly', '2023-07-30 13:40:00', '2023-07-31 10:15:00', 1, 'First version of admin dashboard'),
(5, 'https://github.com/janesmith/admin-dashboard-v2', 'Pending Review', NULL, '2023-08-02 15:30:00', NULL, NULL, 'Fixed chart issues and added more visualizations'),
(6, 'https://github.com/janesmith/responsive-design', 'Pending Review', NULL, '2023-09-14 14:25:00', NULL, NULL, 'Implemented responsive design with media queries'),

-- Alex's submissions
(7, 'https://github.com/alexjohnson/auth-system', 'Approved', 'Very secure implementation', '2023-06-28 10:45:00', '2023-06-29 13:20:00', 1, 'Authentication system with role-based access'),
(8, 'https://github.com/alexjohnson/api-dev', 'Denied', 'Missing error handling in several endpoints', '2023-08-10 09:30:00', '2023-08-11 14:15:00', 1, 'Initial API implementation'),
(8, 'https://github.com/alexjohnson/api-dev-v2', 'Denied', 'Still issues with validation', '2023-08-13 11:20:00', '2023-08-14 15:40:00', 1, 'Added error handling as requested'),
(8, 'https://github.com/alexjohnson/api-dev-v3', 'Approved', 'Great improvement, all issues addressed', '2023-08-16 13:45:00', '2023-08-17 10:30:00', 1, 'Fixed validation and added more tests'),

-- Maria's submissions
(9, 'https://github.com/mariagarcia/db-schema', 'Approved', 'Well-structured schema with good documentation', '2023-07-12 13:15:00', '2023-07-13 10:45:00', 1, 'Database schema with indexes and constraints'),
(10, 'https://github.com/mariagarcia/unit-testing', 'Approved', 'Comprehensive test coverage', '2023-08-28 14:30:00', '2023-08-29 11:20:00', 1, 'Unit tests covering all backend functionality'),
(11, 'https://github.com/mariagarcia/documentation', 'Pending Review', NULL, '2023-09-29 15:45:00', NULL, NULL, 'API documentation with examples'),

-- David's submissions
(12, 'https://github.com/davidlee/admin-dashboard', 'Approved', 'Outstanding UI design and functionality', '2023-07-30 10:20:00', '2023-07-31 13:45:00', 1, 'Admin dashboard with all required features'),
(13, 'https://github.com/davidlee/api-dev', 'Denied', 'API endpoints not following REST conventions', '2023-08-12 09:15:00', '2023-08-13 14:30:00', 1, 'First implementation of API endpoints'),
(13, 'https://github.com/davidlee/api-dev-v2', 'Approved', 'Well-structured RESTful API', '2023-08-15 11:45:00', '2023-08-16 10:20:00', 1, 'Restructured API to follow REST conventions');