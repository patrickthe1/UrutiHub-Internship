const db = require('../utils/db');

/**
 * Create a new submission for a specific assignment
 * @param {number} internTaskId - The intern_task assignment ID
 * @param {string} submissionLink - The submission link (e.g., GitHub repo)
 * @param {string} comments - Optional comments from the intern (stored in feedback for now)
 * @returns {Promise} - Promise resolving to the created submission
 */
const createSubmission = async (internTaskId, submissionLink, comments = null) => {
  try {
    // Store intern comments in the feedback field temporarily until DB schema is updated
    const result = await db.query(
      `INSERT INTO submissions (intern_task_id, submission_link, status, feedback) 
       VALUES ($1, $2, 'Pending Review', $3) 
       RETURNING *`,
      [internTaskId, submissionLink, comments]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
};

/**
 * Find all submissions by their status
 * @param {string} status - The status to filter by ('Pending Review', 'Approved', 'Denied')
 * @returns {Promise} - Promise resolving to an array of submissions with detailed information
 */
const findSubmissionsByStatus = async (status) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.intern_task_id, s.submission_link, s.status, s.feedback,
              s.submitted_at, s.reviewed_at, s.reviewed_by,
              it.intern_id, it.task_id,
              i.name AS intern_name,
              t.title AS task_title, t.description AS task_description
       FROM submissions s
       JOIN intern_tasks it ON s.intern_task_id = it.id
       JOIN interns i ON it.intern_id = i.id
       JOIN tasks t ON it.task_id = t.id
       WHERE s.status = $1
       ORDER BY s.submitted_at DESC`,
      [status]
    );
    return result.rows;
  } catch (error) {
    console.error('Error finding submissions by status:', error);
    throw error;
  }
};

/**
 * Update the status of a submission (approve or deny)
 * @param {number} submissionId - The submission ID
 * @param {string} status - The new status ('Approved' or 'Denied')
 * @param {string} feedback - Optional feedback (required for 'Denied' status)
 * @param {number} reviewerId - The user ID of the reviewer
 * @returns {Promise} - Promise resolving to the updated submission
 */
const updateSubmissionStatus = async (submissionId, status, feedback, reviewerId) => {
  try {
    const result = await db.query(
      `UPDATE submissions 
       SET status = $1, feedback = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, feedback, reviewerId, submissionId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating submission status:', error);
    throw error;
  }
};

/**
 * Find all submissions made by a specific intern
 * @param {number} internId - The intern ID
 * @returns {Promise} - Promise resolving to an array of submissions with task details
 */
const findSubmissionsByInternId = async (internId) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.intern_task_id, s.submission_link, s.status, s.feedback,
              s.submitted_at, s.reviewed_at,
              t.id AS task_id, t.title AS task_title
       FROM submissions s
       JOIN intern_tasks it ON s.intern_task_id = it.id
       JOIN tasks t ON it.task_id = t.id
       WHERE it.intern_id = $1
       ORDER BY s.submitted_at DESC`,
      [internId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error finding submissions by intern ID:', error);
    throw error;
  }
};

/**
 * Check if a submission already exists for an assignment
 * @param {number} internTaskId - The intern_task assignment ID
 * @returns {Promise<boolean>} - Promise resolving to true if submission exists
 */
const submissionExists = async (internTaskId) => {
  try {
    const result = await db.query(
      `SELECT EXISTS(
        SELECT 1 FROM submissions 
        WHERE intern_task_id = $1
      )`,
      [internTaskId]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking if submission exists:', error);
    throw error;
  }
};

module.exports = {
  createSubmission,
  findSubmissionsByStatus,
  updateSubmissionStatus,
  findSubmissionsByInternId,
  submissionExists
};