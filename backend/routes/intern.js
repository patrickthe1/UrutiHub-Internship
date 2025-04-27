// Intern routes for Uruti Hub Internship Dashboard
const express = require('express');
const router = express.Router();

// Import models
const { findInternByUserId } = require('../models/interns');
const { findAssignmentsByInternId, findAssignmentById } = require('../models/internTasks');
const { createSubmission, submissionExists, findSubmissionsByInternId } = require('../models/submissions');

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
router.get('/interns/me/tasks', async (req, res) => {
  try {
    // In a real implementation with auth, the user ID would come from req.user.id
    // For now, we'll assume the authenticated user's ID is available
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

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
router.post('/intern_tasks/:internTaskId/submit', async (req, res) => {
  try {
    const { internTaskId } = req.params;
    const { submission_link } = req.body;

    // Validate submission link
    if (!submission_link) {
      return res.status(400).json({ error: 'Submission link is required' });
    }

    // In a real implementation with auth, the user ID would come from req.user.id
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

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

    // Create the submission
    const submission = await createSubmission(internTaskId, submission_link);

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
});

/**
 * GET /api/interns/me/submissions
 * Get all submissions for the authenticated intern
 */
router.get('/interns/me/submissions', async (req, res) => {
  try {
    // In a real implementation with auth, the user ID would come from req.user.id
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

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

module.exports = router;