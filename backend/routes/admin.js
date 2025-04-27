// Admin routes for Uruti Hub Internship Dashboard
const express = require('express');
const router = express.Router();

// Import models
const { createIntern } = require('../models/interns');
const { createTask, findTaskById } = require('../models/tasks');
const { createAssignment, assignmentExists } = require('../models/internTasks');
const { findSubmissionsByStatus, updateSubmissionStatus } = require('../models/submissions');

/**
 * POST /api/interns
 * Create a new intern
 */
router.post('/interns', async (req, res) => {
  try {
    const { name, phone, referring_source } = req.body;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ error: 'Intern name is required' });
    }
    
    // For MVP, user_id can be null or handled separately
    // In a complete implementation, this would link to a user account
    const newIntern = await createIntern({
      user_id: null, // This would normally come from user creation
      name,
      phone,
      referring_source
    });
    
    res.status(201).json(newIntern);
  } catch (error) {
    console.error('Error creating intern:', error);
    res.status(500).json({ error: 'Failed to create intern' });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/tasks', async (req, res) => {
  try {
    const { title, description, due_date } = req.body;
    
    // Basic validation
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    
    // In a real implementation with auth, assigned_by would come from req.user.id
    // For now, we'll assume the authenticated user's ID is available
    const assigned_by = req.user?.id; // This will be set by auth middleware in Phase 5
    
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
 * POST /api/assignments
 * Assign a task to one or more interns
 */
router.post('/assignments', async (req, res) => {
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
router.get('/submissions/pending', async (req, res) => {
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
router.put('/submissions/:id/approve', async (req, res) => {
  try {
    const submissionId = req.params.id;
    
    // In a real implementation with auth, the reviewer ID would come from req.user.id
    const reviewerId = req.user?.id; // This will be set by auth middleware in Phase 5
    
    const updatedSubmission = await updateSubmissionStatus(
      submissionId,
      'Approved',
      null, // No feedback needed for approval
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
router.put('/submissions/:id/deny', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { feedback } = req.body;
    
    // Validate feedback
    if (!feedback) {
      return res.status(400).json({ error: 'Feedback is required when denying a submission' });
    }
    
    // In a real implementation with auth, the reviewer ID would come from req.user.id
    const reviewerId = req.user?.id; // This will be set by auth middleware in Phase 5
    
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

module.exports = router;