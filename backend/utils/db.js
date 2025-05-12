const { Pool } = require('pg');

// Conditionally load dotenv only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Use DATABASE_URL environment variable with fallback to individual params
const connectionString = process.env.DATABASE_URL;

// Temporary log to verify the DATABASE_URL is being read
console.log('DATABASE_URL availability:', connectionString ? 'Available' : 'Not available');

// Create a pool that will be shared across the application
const pool = new Pool(connectionString ? 
  { 
    connectionString,
    // SSL configuration if needed for production
    ...(process.env.NODE_ENV === 'production' ? { ssl: { rejectUnauthorized: false } } : {})
  } : 
  {
    // Fallback to individual parameters if DATABASE_URL is not available
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  }
);

// Test the connection when this module is loaded
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring database client', err.stack);
    console.error('Please verify the DATABASE_URL environment variable is correctly set in Render dashboard');
    return;
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      console.error('Error executing database query', err.stack);
      return;
    }
    console.log('Database connected successfully from db.js module');
  });
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};