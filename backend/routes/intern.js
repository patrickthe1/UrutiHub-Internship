// Intern routes for Uruti Hub Internship Dashboard
const express = require('express');
const router = express.Router();
const db = require('../utils/db'); // Import db for direct queries

// Import models
const { findInternByUserId } = require('../models/interns');
const { findAssignmentsByInternId, findAssignmentById } = require('../models/internTasks');
const { createSubmission, submissionExists, findSubmissionsByInternId } = require('../models/submissions');

// Import middleware
const authMiddleware = require('../middleware/authMiddleware');
const { internRoleMiddleware } = require('../middleware/roleMiddleware');

/**
 * Middleware to get the intern ID from the authenticated user
 * This is a helper function for the routes
 */
const getInternId = async (userId) => {
  // Find the intern record associated with the authenticated user
  const intern = await findInternByUserId(userId);
  if (!intern) {
    return null;
  }
  return intern.id;
};

/**
 * GET /api/interns/me/tasks
 * Get all assigned tasks for the authenticated intern
 */
router.get('/interns/me/tasks', authMiddleware, internRoleMiddleware, async (req, res) => {
  try {
    // With auth middleware, req.user is guaranteed to exist
    const userId = req.user.id;

    // Get the intern ID associated with the user
    const internId = await getInternId(userId);
    if (!internId) {
      return res.status(404).json({ error: 'Intern profile not found for this user' });
    }

    // Get all assignments for this intern with task details
    const assignments = await findAssignmentsByInternId(internId);

    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching intern tasks:', error);
    res.status(500).json({ error: 'Failed to fetch assigned tasks' });
  }
});

/**
 * POST /api/intern_tasks/:internTaskId/submit
 * Submit a solution link for a specific assigned task
 */
router.post('/intern_tasks/:internTaskId/submit', authMiddleware, internRoleMiddleware, async (req, res) => {
  try {
    const { internTaskId } = req.params;
    const { submission_link, comments } = req.body;

    // Validate submission link
    if (!submission_link) {
      return res.status(400).json({ error: 'Submission link is required' });
    }

    // With auth middleware, req.user is guaranteed to exist
    const userId = req.user.id;

    // Get the intern ID associated with the user
    const internId = await getInternId(userId);
    if (!internId) {
      return res.status(404).json({ error: 'Intern profile not found for this user' });
    }

    // Check if the task assignment exists and belongs to this intern
    const assignment = await findAssignmentById(internTaskId);
    if (!assignment) {
      return res.status(404).json({ error: 'Task assignment not found' });
    }

    if (assignment.intern_id !== internId) {
      return res.status(403).json({ error: 'You do not have permission to submit for this task' });
    }

    // Check if a submission already exists for this task assignment
    const exists = await submissionExists(internTaskId);
    if (exists) {
      return res.status(409).json({ error: 'A submission already exists for this task' });
    }

    // Create the submission with comments
    const submission = await createSubmission(internTaskId, submission_link, comments);

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
});

/**
 * GET /api/intern_tasks/:internTaskId
 * Get details for a specific task assignment
 */
router.get('/intern_tasks/:internTaskId', authMiddleware, internRoleMiddleware, async (req, res) => {
  try {
    const { internTaskId } = req.params;
    
    // With auth middleware, req.user is guaranteed to exist
    const userId = req.user.id;

    // Get the intern ID associated with the user
    const internId = await getInternId(userId);
    if (!internId) {
      return res.status(404).json({ error: 'Intern profile not found for this user' });
    }

    // Find the assignment by ID and join with task details
    const result = await db.query(
      `SELECT it.id, it.intern_id, it.task_id, it.assigned_at,
              t.title, t.description, t.due_date,
              i.name as intern_name
       FROM intern_tasks it
       JOIN tasks t ON it.task_id = t.id
       JOIN interns i ON it.intern_id = i.id
       WHERE it.id = $1`,
      [internTaskId]
    );
    
    // If no assignment found with this ID
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task assignment not found' });
    }
    
    const assignment = result.rows[0];
    
    // Verify that the assignment belongs to the authenticated intern
    if (assignment.intern_id !== internId) {
      return res.status(403).json({ error: 'You do not have permission to access this task assignment' });
    }
    
    res.status(200).json(assignment);
  } catch (error) {
    console.error('Error fetching task assignment:', error);
    res.status(500).json({ error: 'Failed to fetch task assignment' });
  }
});

/**
 * GET /api/interns/me/submissions
 * Get all submissions for the authenticated intern
 */
router.get('/interns/me/submissions', authMiddleware, internRoleMiddleware, async (req, res) => {
  try {
    // With auth middleware, req.user is guaranteed to exist
    const userId = req.user.id;

    // Get the intern ID associated with the user
    const internId = await getInternId(userId);
    if (!internId) {
      return res.status(404).json({ error: 'Intern profile not found for this user' });
    }

    // Get all submissions for this intern
    const submissions = await findSubmissionsByInternId(internId);

    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching intern submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * GET /api/interns/me/dashboard-stats
 * Get dashboard statistics for Intern dashboard
 * Returns counts for total assigned tasks, and submissions with different statuses
 */
router.get('/interns/me/dashboard-stats', authMiddleware, internRoleMiddleware, async (req, res) => {
  try {
    // With auth middleware, req.user is guaranteed to exist
    const userId = req.user.id;

    // Get the intern ID associated with the user
    const internId = await getInternId(userId);
    if (!internId) {
      return res.status(404).json({ error: 'Intern profile not found for this user' });
    }

    // 1. Query for total assigned tasks count
    const assignedTasksResult = await db.query(
      'SELECT COUNT(*) AS total_assigned_tasks FROM intern_tasks WHERE intern_id = $1',
      [internId]
    );
    const total_assigned_tasks = parseInt(assignedTasksResult.rows[0].total_assigned_tasks);
    
    // 2. Query for submissions with 'Pending Review' status
    const pendingReviewResult = await db.query(
      `SELECT COUNT(*) AS submissions_pending_review 
       FROM submissions s
       JOIN intern_tasks it ON s.intern_task_id = it.id
       WHERE it.intern_id = $1 AND s.status = 'Pending Review'`,
      [internId]
    );
    const submissions_pending_review = parseInt(pendingReviewResult.rows[0].submissions_pending_review);
    
    // 3. Query for submissions with 'Approved' status
    const approvedResult = await db.query(
      `SELECT COUNT(*) AS submissions_approved 
       FROM submissions s
       JOIN intern_tasks it ON s.intern_task_id = it.id
       WHERE it.intern_id = $1 AND s.status = 'Approved'`,
      [internId]
    );
    const submissions_approved = parseInt(approvedResult.rows[0].submissions_approved);
    
    // 4. Query for submissions with 'Denied' status
    const deniedResult = await db.query(
      `SELECT COUNT(*) AS submissions_denied 
       FROM submissions s
       JOIN intern_tasks it ON s.intern_task_id = it.id
       WHERE it.intern_id = $1 AND s.status = 'Denied'`,
      [internId]
    );
    const submissions_denied = parseInt(deniedResult.rows[0].submissions_denied);
    
    // Return all counts in a single JSON object
    res.status(200).json({
      total_assigned_tasks,
      submissions_pending_review,
      submissions_approved,
      submissions_denied
    });
    
  } catch (error) {
    console.error('Error fetching intern dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;