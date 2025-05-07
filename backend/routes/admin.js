// Admin routes for Uruti Hub Internship Dashboard
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const db = require('../utils/db'); // Import db for transactions

// Import models
const { createIntern, findAllInterns } = require('../models/interns');
const { createTask, findTaskById, findAllTasks } = require('../models/tasks');
const { createAssignment, assignmentExists } = require('../models/internTasks');
const { findSubmissionsByStatus, updateSubmissionStatus, findSubmissionsByInternTaskId } = require('../models/submissions');

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
    const { feedback } = req.body || {}; // Make feedback optional
    // With auth middleware, req.user is guaranteed to exist
    const reviewerId = req.user.id;
    
    const updatedSubmission = await updateSubmissionStatus(
      submissionId,
      'Approved',
      feedback || null, // Pass null if feedback is undefined
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

/**
 * GET /api/submissions/history/:internTaskId
 * Get full submission history for a specific task assignment
 * Admin role has access to any submission history
 */
router.get('/submissions/history/:internTaskId', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    const { internTaskId } = req.params;
    
    // Fetch all submissions for this task assignment
    const submissions = await findSubmissionsByInternTaskId(internTaskId);
    
    if (!submissions || submissions.length === 0) {
      return res.status(404).json({ error: 'No submissions found for this task assignment' });
    }
    
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching submission history:', error);
    res.status(500).json({ error: 'Failed to fetch submission history' });
  }
});

/**
 * GET /api/admin/stats/submission-statuses
 * Get counts of submissions grouped by status for Admin dashboard charts
 * Returns counts for 'Pending Review', 'Approved', and 'Denied' submissions
 */
router.get('/admin/stats/submission-statuses', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    // Query to get submission counts by status
    const result = await db.query(`
      SELECT status, COUNT(*) as count
      FROM submissions
      GROUP BY status
      ORDER BY status
    `);
    
    // Convert the rows to a more frontend-friendly format
    const statusCounts = result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count)
    }));
    
    res.status(200).json(statusCounts);
  } catch (error) {
    console.error('Error fetching submission status counts:', error);
    res.status(500).json({ error: 'Failed to fetch submission status counts' });
  }
});

/**
 * GET /api/admin/stats/completion-over-time
 * Get data for Task Completion Rate Over Time chart
 * Returns counts of approved submissions grouped by month/year
 */
router.get('/admin/stats/completion-over-time', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    // Get optional 'months' parameter with default of 12 months
    const months = req.query.months ? parseInt(req.query.months) : 12;
    
    // Query to get approved submissions grouped by month
    const result = await db.query(`
      SELECT 
        TO_CHAR(reviewed_at, 'YYYY-MM') AS period,
        COUNT(*) AS count
      FROM submissions
      WHERE 
        status = 'Approved' 
        AND reviewed_at IS NOT NULL
        AND reviewed_at >= NOW() - INTERVAL '${months} months'
      GROUP BY period
      ORDER BY period ASC
    `);
    
    // Convert the rows to a more frontend-friendly format
    const timeData = result.rows.map(row => ({
      period: row.period,
      count: parseInt(row.count)
    }));
    
    res.status(200).json(timeData);
  } catch (error) {
    console.error('Error fetching completion over time data:', error);
    res.status(500).json({ error: 'Failed to fetch completion over time data' });
  }
});

/**
 * GET /api/admin/stats/submissions-per-intern
 * Get data for Submissions Per Intern chart
 * Returns counts of submissions made by each intern
 */
router.get('/admin/stats/submissions-per-intern', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    // Query to get submission counts by intern
    const result = await db.query(`
      SELECT 
        i.id AS intern_id, 
        i.name AS intern_name, 
        COUNT(s.id) AS submission_count
      FROM 
        submissions s
      JOIN 
        intern_tasks it ON s.intern_task_id = it.id
      JOIN 
        interns i ON it.intern_id = i.id
      GROUP BY 
        i.id, i.name
      ORDER BY 
        submission_count DESC
    `);
    
    // Convert the rows to a more frontend-friendly format
    const internData = result.rows.map(row => ({
      internId: row.intern_id,
      internName: row.intern_name,
      submissionCount: parseInt(row.submission_count)
    }));
    
    res.status(200).json(internData);
  } catch (error) {
    console.error('Error fetching submissions per intern data:', error);
    res.status(500).json({ error: 'Failed to fetch submissions per intern data' });
  }
});

/**
 * GET /api/admin/stats/assigned-vs-completed
 * Get data for Tasks Assigned vs. Tasks Completed chart
 * Returns counts of total assigned tasks and total completed tasks
 */
router.get('/admin/stats/assigned-vs-completed', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    // Query to get total assigned tasks count
    const assignedResult = await db.query('SELECT COUNT(*) AS total_assigned FROM intern_tasks');
    const totalAssigned = parseInt(assignedResult.rows[0].total_assigned);
    
    // Query to get total completed tasks count (where the latest submission is 'Approved')
    // Using a subquery to get the latest submission for each intern_task
    const completedResult = await db.query(`
      SELECT COUNT(*) AS total_completed
      FROM intern_tasks it
      WHERE EXISTS (
        SELECT 1
        FROM submissions s1
        WHERE 
          s1.intern_task_id = it.id 
          AND s1.status = 'Approved'
          AND s1.submitted_at = (
            SELECT MAX(submitted_at)
            FROM submissions s2
            WHERE s2.intern_task_id = it.id
          )
      )
    `);
    const totalCompleted = parseInt(completedResult.rows[0].total_completed);
    
    // Return both counts in a single JSON object
    res.status(200).json({
      totalAssigned,
      totalCompleted
    });
  } catch (error) {
    console.error('Error fetching assigned vs. completed counts:', error);
    res.status(500).json({ error: 'Failed to fetch assigned vs. completed counts' });
  }
});

module.exports = router;