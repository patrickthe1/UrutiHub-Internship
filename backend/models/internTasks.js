const db = require('../utils/db');

/**
 * Create a new assignment linking an intern to a task
 * @param {number} internId - The intern ID
 * @param {number} taskId - The task ID
 * @returns {Promise} - Promise resolving to the created assignment
 */
const createAssignment = async (internId, taskId) => {
  try {
    const result = await db.query(
      `INSERT INTO intern_tasks (intern_id, task_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [internId, taskId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

/**
 * Find all assignments for a specific intern
 * @param {number} internId - The intern ID
 * @returns {Promise} - Promise resolving to an array of assignments with task details and latest submission status
 */
const findAssignmentsByInternId = async (internId) => {
  try {
    const result = await db.query(
      `SELECT it.id AS assignment_id, it.intern_id, it.task_id, it.assigned_at,
              t.title, t.description, t.due_date,
              COALESCE(latest_sub.status, 'Not Started') AS latest_submission_status,
              latest_sub.submitted_at AS latest_submission_date
       FROM intern_tasks it
       JOIN tasks t ON it.task_id = t.id
       LEFT JOIN LATERAL (
         SELECT s.status, s.submitted_at
         FROM submissions s
         WHERE s.intern_task_id = it.id
         ORDER BY s.submitted_at DESC
         LIMIT 1
       ) latest_sub ON true
       WHERE it.intern_id = $1
       ORDER BY t.due_date ASC`,
      [internId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error finding assignments by intern ID:', error);
    throw error;
  }
};

/**
 * Find a specific assignment by its ID
 * @param {number} assignmentId - The assignment ID
 * @returns {Promise} - Promise resolving to the found assignment or null
 */
const findAssignmentById = async (assignmentId) => {
  try {
    const result = await db.query(
      `SELECT it.id, it.intern_id, it.task_id, it.assigned_at,
              t.title, t.description, t.due_date
       FROM intern_tasks it
       JOIN tasks t ON it.task_id = t.id
       WHERE it.id = $1`,
      [assignmentId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding assignment by ID:', error);
    throw error;
  }
};

/**
 * Check if an assignment already exists for an intern and task
 * @param {number} internId - The intern ID
 * @param {number} taskId - The task ID
 * @returns {Promise<boolean>} - Promise resolving to true if assignment exists
 */
const assignmentExists = async (internId, taskId) => {
  try {
    const result = await db.query(
      `SELECT EXISTS(
        SELECT 1 FROM intern_tasks 
        WHERE intern_id = $1 AND task_id = $2
      )`,
      [internId, taskId]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking if assignment exists:', error);
    throw error;
  }
};

module.exports = {
  createAssignment,
  findAssignmentsByInternId,
  findAssignmentById,
  assignmentExists
};