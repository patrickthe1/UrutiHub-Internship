const db = require('../utils/db');

/**
 * Create a new intern record in the database
 * @param {Object} data - The intern data
 * @param {number} data.user_id - The associated user ID
 * @param {string} data.name - The intern's full name
 * @param {string} data.phone - The intern's phone number
 * @param {string} data.referring_source - Where the intern was referred from
 * @returns {Promise} - Promise resolving to the created intern
 */
const createIntern = async (data) => {
  const { user_id, name, phone, referring_source } = data;

  try {
    const result = await db.query(
      `INSERT INTO interns (user_id, name, phone, referring_source) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [user_id, name, phone, referring_source]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating intern:', error);
    throw error;
  }
};

/**
 * Find an intern by their ID
 * @param {number} id - The intern ID
 * @returns {Promise} - Promise resolving to the found intern or null
 */
const findInternById = async (id) => {
  try {
    const result = await db.query('SELECT * FROM interns WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding intern by ID:', error);
    throw error;
  }
};

/**
 * Find an intern by their user ID
 * @param {number} userId - The associated user ID
 * @returns {Promise} - Promise resolving to the found intern or null
 */
const findInternByUserId = async (userId) => {
  try {
    const result = await db.query('SELECT * FROM interns WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding intern by user ID:', error);
    throw error;
  }
};

/**
 * Find all interns in the database
 * @returns {Promise} - Promise resolving to an array of interns
 */
const findAllInterns = async () => {
  try {
    // Enhanced query that:
    // 1. Joins interns with users to get email
    // 2. LEFT JOINs with intern_tasks and submissions to count approved submissions
    // 3. Groups by intern and user data to get one row per intern
    const result = await db.query(
      `SELECT i.*, 
              u.email,
              COUNT(CASE WHEN s.status = 'Approved' THEN 1 END) AS tasks_completed_count 
       FROM interns i
       JOIN users u ON i.user_id = u.id
       LEFT JOIN intern_tasks it ON i.id = it.intern_id
       LEFT JOIN submissions s ON it.id = s.intern_task_id
       GROUP BY i.id, u.id
       ORDER BY i.created_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error finding all interns:', error);
    throw error;
  }
};

module.exports = {
  createIntern,
  findInternById,
  findInternByUserId,
  findAllInterns
};