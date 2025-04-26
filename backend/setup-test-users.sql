-- Insert test users if they don't exist
-- Admin user (ID will be 1 if table is empty)
INSERT INTO users (email, password_hash, role)
SELECT 'admin@urutihub.com', '$2b$10$i8.5cwPjN50a3.TKEGYlHOD5KzH2spnw6pj6r3vr6mf.kJa98zhQq', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@urutihub.com'
);

-- Intern user (ID will be 2 if only admin exists)
INSERT INTO users (email, password_hash, role)
SELECT 'intern@urutihub.com', '$2b$10$i8.5cwPjN50a3.TKEGYlHOD5KzH2spnw6pj6r3vr6mf.kJa98zhQq', 'intern'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'intern@urutihub.com'
);

-- Show the users that were created
SELECT id, email, role FROM users;