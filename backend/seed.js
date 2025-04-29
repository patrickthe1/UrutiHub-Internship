/**
 * Seed script for Uruti Hub Internship Dashboard
 * 
 * This script populates the database with test data for frontend integration testing.
 * It creates admin users, intern users, tasks, assignments, and submissions.
 * 
 * Run with: node seed.js
 */

const bcrypt = require('bcrypt');
const { pool } = require('./utils/db');

// Import models
// Note: We're importing the models directly, but we'll need to handle transactions manually
// for operations that require them (like creating an intern with a linked user)
const { createTask, findTaskById } = require('./models/tasks');
const { createAssignment, assignmentExists } = require('./models/internTasks');
const { findSubmissionsByStatus, updateSubmissionStatus } = require('./models/submissions');

/**
 * Creates a user with the specified email, password and role
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password (will be hashed)
 * @param {string} userData.role - User role ('admin' or 'intern')
 * @returns {Promise<Object>} - Created user object
 */
async function createUser(userData) {
  const { email, password, role } = userData;
  
  // Hash the password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);
  
  // Insert the user
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
    [email, password_hash, role]
  );
  
  console.log(`Created ${role} user: ${email}`);
  return result.rows[0];
}

/**
 * Creates an intern with a linked user account
 * @param {Object} internData - Intern and user data
 * @param {string} internData.name - Intern name
 * @param {string} internData.phone - Intern phone
 * @param {string} internData.referring_source - Where the intern heard about the program
 * @param {string} internData.email - User email for the intern
 * @param {string} internData.password - User password for the intern
 * @returns {Promise<Object>} - Object containing created intern and user data
 */
async function createInternWithUser(internData) {
  const { name, phone, referring_source, email, password } = internData;
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Create user with 'intern' role
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, await bcrypt.hash(password, 10), 'intern']
    );
    
    const user_id = userResult.rows[0].id;
    
    // Create intern record linked to the new user
    const internResult = await client.query(
      'INSERT INTO interns (user_id, name, phone, referring_source) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, name, phone, referring_source]
    );
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log(`Created intern: ${name} with email: ${email}`);
    return {
      intern: internResult.rows[0],
      user: userResult.rows[0]
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating intern with user account:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Creates a submission for an intern task
 * @param {Object} submissionData - Submission data
 * @param {number} submissionData.intern_task_id - ID of the intern task
 * @param {string} submissionData.submission_link - URL submitted by the intern
 * @param {string} submissionData.comments - Optional comments from the intern
 * @returns {Promise<Object>} - Created submission
 */
async function createSubmission(submissionData) {
  const { intern_task_id, submission_link, comments } = submissionData;
  
  const result = await pool.query(
    `INSERT INTO submissions (intern_task_id, submission_link, comments, status, submitted_at) 
     VALUES ($1, $2, $3, 'Pending Review', NOW()) 
     RETURNING *`,
    [intern_task_id, submission_link, comments]
  );
  
  console.log(`Created submission for intern task ID: ${intern_task_id}`);
  return result.rows[0];
}

/**
 * Main function to seed the database
 */
async function seedDatabase() {
  try {
    console.log('Starting database seeding process...');
    
    // 1. Create admin user
    const admin = await createUser({
      email: 'admin@uruti.com',
      password: 'password123',
      role: 'admin'
    });
    
    // 2. Create intern users with profiles
    const interns = [];
    const internData = [
      { 
        name: 'John Smith', 
        phone: '1234567890', 
        referring_source: 'University Placement Office',
        email: 'john@example.com',
        password: 'password123'
      },
      { 
        name: 'Jane Doe', 
        phone: '2345678901', 
        referring_source: 'LinkedIn',
        email: 'jane@example.com',
        password: 'password123'
      },
      { 
        name: 'Mike Johnson', 
        phone: '3456789012', 
        referring_source: 'Career Fair',
        email: 'mike@example.com',
        password: 'password123'
      },
      { 
        name: 'Sarah Williams', 
        phone: '4567890123', 
        referring_source: 'Friend Referral',
        email: 'sarah@example.com',
        password: 'password123'
      },
      { 
        name: 'David Brown', 
        phone: '5678901234', 
        referring_source: 'Social Media',
        email: 'david@example.com',
        password: 'password123'
      }
    ];
    
    for (const data of internData) {
      const result = await createInternWithUser(data);
      interns.push(result);
    }
    
    // 3. Create tasks assigned by admin
    const tasks = [];
    const taskData = [
      {
        title: 'Frontend Development - UI Components',
        description: 'Create reusable UI components using React and Tailwind CSS for the dashboard interface.',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        assigned_by: admin.id
      },
      {
        title: 'API Integration',
        description: 'Implement API integration between frontend and backend services using Axios.',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        assigned_by: admin.id
      },
      {
        title: 'Database Optimization',
        description: 'Optimize database queries and implement proper indexing for better performance.',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        assigned_by: admin.id
      },
      {
        title: 'Authentication System',
        description: 'Implement JWT-based authentication system with role-based access control.',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        assigned_by: admin.id
      },
      {
        title: 'Testing and Documentation',
        description: 'Write unit tests and documentation for the existing codebase.',
        due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        assigned_by: admin.id
      }
    ];
    
    for (const data of taskData) {
      const task = await createTask(data);
      tasks.push(task);
      console.log(`Created task: ${task.title}`);
    }
    
    // 4. Assign tasks to interns (create assignments)
    const assignments = [];
    
    // Task 1 assigned to interns 1, 2, 3
    for (let i = 0; i < 3; i++) {
      const intern = interns[i];
      const assignment = await createAssignment(intern.intern.id, tasks[0].id);
      assignments.push(assignment);
      console.log(`Assigned task "${tasks[0].title}" to intern ${intern.intern.name}`);
    }
    
    // Task 2 assigned to interns 2, 3, 4
    for (let i = 1; i < 4; i++) {
      const intern = interns[i];
      const assignment = await createAssignment(intern.intern.id, tasks[1].id);
      assignments.push(assignment);
      console.log(`Assigned task "${tasks[1].title}" to intern ${intern.intern.name}`);
    }
    
    // Task 3 assigned to interns 4, 5
    for (let i = 3; i < 5; i++) {
      const intern = interns[i];
      const assignment = await createAssignment(intern.intern.id, tasks[2].id);
      assignments.push(assignment);
      console.log(`Assigned task "${tasks[2].title}" to intern ${intern.intern.name}`);
    }
    
    // Task 4 assigned to interns 1, 3, 5
    for (let i of [0, 2, 4]) {
      const intern = interns[i];
      const assignment = await createAssignment(intern.intern.id, tasks[3].id);
      assignments.push(assignment);
      console.log(`Assigned task "${tasks[3].title}" to intern ${intern.intern.name}`);
    }
    
    // Task 5 assigned to all interns
    for (let i = 0; i < 5; i++) {
      const intern = interns[i];
      const assignment = await createAssignment(intern.intern.id, tasks[4].id);
      assignments.push(assignment);
      console.log(`Assigned task "${tasks[4].title}" to intern ${intern.intern.name}`);
    }
    
    // 5. Create submissions with different statuses
    
    // Create submissions with "Pending Review" status
    // Intern 1 submits for Task 1
    await createSubmission({
      intern_task_id: assignments[0].id,
      submission_link: 'https://github.com/intern1/ui-components',
      comments: 'I focused on creating reusable components with proper props validation. All components are responsive and follow the design system guidelines.'
    });
    
    // Intern 2 submits for Task 2
    await createSubmission({
      intern_task_id: assignments[3].id,
      submission_link: 'https://github.com/intern2/api-integration',
      comments: 'Implemented Axios interceptors for error handling and JWT token management. Added proper loading states for all API calls.'
    });
    
    // Intern 5 submits for Task 5
    await createSubmission({
      intern_task_id: assignments[assignments.length - 1].id,
      submission_link: 'https://github.com/intern5/documentation',
      comments: 'Created comprehensive documentation including API references, component usage examples, and setup instructions.'
    });
    
    // Create submissions with "Approved" status
    // Intern 3 submits for Task 1 and gets approved
    const submission1 = await createSubmission({
      intern_task_id: assignments[2].id,
      submission_link: 'https://github.com/intern3/ui-components-complete',
      comments: 'Implemented all required components with storybook examples. Added unit tests with 95% coverage.'
    });
    
    await updateSubmissionStatus(
      submission1.id,
      'Approved',
      null,
      admin.id
    );
    console.log(`Updated submission ${submission1.id} to "Approved" status`);
    
    // Intern 4 submits for Task 2 and gets approved
    const submission2 = await createSubmission({
      intern_task_id: assignments[6].id,
      submission_link: 'https://github.com/intern4/api-integration-complete'
    });
    
    await updateSubmissionStatus(
      submission2.id,
      'Approved',
      null,
      admin.id
    );
    console.log(`Updated submission ${submission2.id} to "Approved" status`);
    
    // Create submissions with "Denied" status and feedback
    // Intern 1 submits for Task 4 and gets denied
    const submission3 = await createSubmission({
      intern_task_id: assignments[9].id,
      submission_link: 'https://github.com/intern1/auth-system'
    });
    
    await updateSubmissionStatus(
      submission3.id,
      'Denied',
      'Authentication implementation is missing role-based access control. Please add RBAC and resubmit.',
      admin.id
    );
    console.log(`Updated submission ${submission3.id} to "Denied" status with feedback`);
    
    // Intern 5 submits for Task 3 and gets denied
    const submission4 = await createSubmission({
      intern_task_id: assignments[8].id,
      submission_link: 'https://github.com/intern5/db-optimization'
    });
    
    await updateSubmissionStatus(
      submission4.id,
      'Denied',
      'The database indexing strategy needs improvement. Please revisit the indexing on foreign keys.',
      admin.id
    );
    console.log(`Updated submission ${submission4.id} to "Denied" status with feedback`);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close the pool when done
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedDatabase().catch(err => {
  console.error('Unhandled error in seed script:', err);
  process.exit(1);
});