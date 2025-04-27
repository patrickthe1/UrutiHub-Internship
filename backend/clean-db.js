/**
 * Database Cleaning Script for Uruti Hub Internship Dashboard
 * 
 * This script cleans the database by truncating all tables and resetting their identity sequences.
 * Run this script before running the seed script to ensure a clean state.
 * 
 * Run with: node clean-db.js
 */

const { pool } = require('./utils/db');

async function cleanDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database cleaning process...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Truncate all tables with CASCADE and RESTART IDENTITY
    // Order matters due to foreign key constraints
    console.log('Truncating submissions table...');
    await client.query('TRUNCATE TABLE submissions RESTART IDENTITY CASCADE;');
    
    console.log('Truncating intern_tasks table...');
    await client.query('TRUNCATE TABLE intern_tasks RESTART IDENTITY CASCADE;');
    
    console.log('Truncating interns table...');
    await client.query('TRUNCATE TABLE interns RESTART IDENTITY CASCADE;');
    
    console.log('Truncating tasks table...');
    await client.query('TRUNCATE TABLE tasks RESTART IDENTITY CASCADE;');
    
    console.log('Truncating users table...');
    await client.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Database cleaning completed successfully!');
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error cleaning database:', error);
    process.exit(1);
  } finally {
    // Close the connection
    client.release();
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the clean function
cleanDatabase().catch(err => {
  console.error('Unhandled error in clean script:', err);
  process.exit(1);
});