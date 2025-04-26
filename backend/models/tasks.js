const db = require('../utils/db');

/**
 * Create a new task record in the database
 * @param {Object} data - The task data
 * @param {string} data.title - The task title
 * @param {string} data.description - The task description
 * @param {Date} data.due_date - The task due date
 * @param {number} data.assigned_by - The ID of the admin who created the task
 * @returns {Promise} - Promise resolving to the created task
 */
const createTask = async (data) => {
  const { title, description, due_date, assigned_by } = data;

  try {
    const result = await db.query(
      `INSERT INTO tasks (title, description, due_date, assigned_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [title, description, due_date, assigned_by]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * Find a task by its ID
 * @param {number} id - The task ID
 * @returns {Promise} - Promise resolving to the found task or null
 */
const findTaskById = async (id) => {
  try {
    const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding task by ID:', error);
    throw error;
  }
};

/**
 * Find all tasks in the database
 * @returns {Promise} - Promise resolving to an array of tasks
 */
const findAllTasks = async () => {
  try {
    const result = await db.query('SELECT * FROM tasks ORDER BY due_date ASC');
    return result.rows;
  } catch (error) {
    console.error('Error finding all tasks:', error);
    throw error;
  }
};

module.exports = {
  createTask,
  findTaskById,
  findAllTasks
};