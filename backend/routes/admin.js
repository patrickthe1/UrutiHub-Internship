// Admin routes for Uruti Hub Internship Dashboard
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const db = require('../utils/db'); // Import db for transactions

// Import models
const { createIntern, findAllInterns } = require('../models/interns');
const { createTask, findTaskById, findAllTasks } = require('../models/tasks');
const { createAssignment, assignmentExists } = require('../models/internTasks');
const { findSubmissionsByStatus, updateSubmissionStatus } = require('../models/submissions');

// Import middleware
const authMiddleware = require('../middleware/authMiddleware');
const { adminRoleMiddleware } = require('../middleware/roleMiddleware');

/**
 * POST /api/interns
 * Create a new intern and their user account
 * Creates both a user record and an intern record, linked via user_id
 */
router.post('/interns', authMiddleware, adminRoleMiddleware, async (req, res) => {
  // Extract all required fields for both user and intern
  const { name, phone, referring_source, email, password } = req.body;
  
  // Basic validation
  if (!name) {
    return res.status(400).json({ error: 'Intern name is required' });
  }
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required for intern account' });
  }

  const client = await db.pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Check if user with email already exists
    const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Create user with 'intern' role
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, password_hash, 'intern']
    );
    
    const user_id = userResult.rows[0].id;
    
    // Create intern record linked to the new user
    const internResult = await client.query(
      'INSERT INTO interns (user_id, name, phone, referring_source) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, name, phone, referring_source]
    );
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Return the created intern with user info
    const newIntern = internResult.rows[0];
    res.status(201).json({
      intern: newIntern,
      user: {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        role: userResult.rows[0].role
      },
      message: 'Intern and user account created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating intern with user account:', error);
    res.status(500).json({ error: 'Failed to create intern and user account' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/interns
 * Get all interns
 */
router.get('/interns', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    const interns = await findAllInterns();
    res.status(200).json(interns);
  } catch (error) {
    console.error('Error fetching interns:', error);
    res.status(500).json({ error: 'Failed to fetch interns' });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/tasks', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    const { title, description, due_date } = req.body;
    
    // Basic validation
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    
    // With auth middleware, req.user is guaranteed to exist
    const assigned_by = req.user.id;
    
    const newTask = await createTask({
      title,
      description,
      due_date,
      assigned_by
    });
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * GET /api/tasks
 * Get all tasks
 */
router.get('/tasks', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    const tasks = await findAllTasks();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * POST /api/assignments
 * Assign a task to one or more interns
 */
router.post('/assignments', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    const { task_id, intern_ids } = req.body;
    
    // Basic validation
    if (!task_id || !intern_ids || !Array.isArray(intern_ids) || intern_ids.length === 0) {
      return res.status(400).json({ error: 'Task ID and at least one intern ID are required' });
    }
    
    // Verify task exists
    const task = await findTaskById(task_id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Create assignments for each intern
    const createdAssignments = [];
    const errors = [];
    
    for (const internId of intern_ids) {
      try {
        // Check if assignment already exists
        const exists = await assignmentExists(internId, task_id);
        if (exists) {
          errors.push({ internId, message: 'Assignment already exists for this intern and task' });
          continue;
        }
        
        const assignment = await createAssignment(internId, task_id);
        createdAssignments.push(assignment);
      } catch (err) {
        errors.push({ internId, message: 'Failed to create assignment' });
      }
    }
    
    // If no assignments were created successfully
    if (createdAssignments.length === 0) {
      return res.status(400).json({ error: 'Failed to create any assignments', details: errors });
    }
    
    // Return created assignments and any errors
    res.status(201).json({
      assignments: createdAssignments,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error creating assignments:', error);
    res.status(500).json({ error: 'Failed to create assignments' });
  }
});

/**
 * GET /api/submissions/pending
 * Get all submissions with 'Pending Review' status
 */
router.get('/submissions/pending', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    const pendingSubmissions = await findSubmissionsByStatus('Pending Review');
    res.status(200).json(pendingSubmissions);
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    res.status(500).json({ error: 'Failed to fetch pending submissions' });
  }
});

/**
 * PUT /api/submissions/:id/approve
 * Approve a submission
 */
router.put('/submissions/:id/approve', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { feedback } = req.body
    // With auth middleware, req.user is guaranteed to exist
    const reviewerId = req.user.id;
    
    const updatedSubmission = await updateSubmissionStatus(
      submissionId,
      'Approved',
      feedback, 
      reviewerId
    );
    
    if (!updatedSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.status(200).json(updatedSubmission);
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
});

/**
 * PUT /api/submissions/:id/deny
 * Deny a submission with feedback
 */
router.put('/submissions/:id/deny', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { feedback } = req.body;
    
    // Validate feedback
    if (!feedback) {
      return res.status(400).json({ error: 'Feedback is required when denying a submission' });
    }
    
    // With auth middleware, req.user is guaranteed to exist
    const reviewerId = req.user.id;
    
    const updatedSubmission = await updateSubmissionStatus(
      submissionId,
      'Denied',
      feedback,
      reviewerId
    );
    
    if (!updatedSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.status(200).json(updatedSubmission);
  } catch (error) {
    console.error('Error denying submission:', error);
    res.status(500).json({ error: 'Failed to deny submission' });
  }
});

/**
 * GET /api/admin/dashboard-stats
 * Get dashboard statistics for Admin dashboard
 * Returns counts for total interns, total tasks, and total submissions
 */
router.get('/admin/dashboard-stats', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    // Query to get total interns count
    const internsResult = await db.query('SELECT COUNT(*) AS total_interns FROM interns');
    const total_interns = parseInt(internsResult.rows[0].total_interns);
    
    // Query to get total tasks count
    const tasksResult = await db.query('SELECT COUNT(*) AS total_tasks_created FROM tasks');
    const total_tasks_created = parseInt(tasksResult.rows[0].total_tasks_created);
    
    // Query to get total submissions count
    const submissionsResult = await db.query('SELECT COUNT(*) AS total_submissions FROM submissions');
    const total_submissions = parseInt(submissionsResult.rows[0].total_submissions);
    
    // Return all counts in a single JSON object
    res.status(200).json({
      total_interns,
      total_tasks_created,
      total_submissions
    });
    
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;