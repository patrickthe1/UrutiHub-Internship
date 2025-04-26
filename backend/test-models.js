require('dotenv').config();
const interns = require('./models/interns');
const tasks = require('./models/tasks');
const internTasks = require('./models/internTasks');
const submissions = require('./models/submissions');

/**
 * Test function to run all model tests sequentially
 */
async function runTests() {
  try {
    console.log('Starting model tests...\n');

    // Test variables to store IDs for use in subsequent tests
    let adminUserId, internUserId, internId, taskId, assignmentId, submissionId;

    // Assume admin user ID is 1 (you may need to adjust this based on your database)
    adminUserId = 1;
    
    // Step 1: Test createIntern
    console.log('1. Testing createIntern...');
    const internData = {
      user_id: 2, // Adjust this if needed based on your database
      name: 'Test Intern',
      phone: '123-456-7890',
      referring_source: 'Test Source'
    };
    
    const newIntern = await interns.createIntern(internData);
    console.log('✅ Created intern:', newIntern);
    internId = newIntern.id;
    internUserId = newIntern.user_id;
    
    // Step 2: Test findInternById
    console.log('\n2. Testing findInternById...');
    const foundInternById = await interns.findInternById(internId);
    console.log('✅ Found intern by ID:', foundInternById);
    
    // Step 3: Test findAllInterns
    console.log('\n3. Testing findAllInterns...');
    const allInterns = await interns.findAllInterns();
    console.log(`✅ Found ${allInterns.length} interns`);
    
    // Step 4: Test createTask
    console.log('\n4. Testing createTask...');
    const taskData = {
      title: 'Test Task',
      description: 'This is a test task for the intern',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assigned_by: adminUserId
    };
    
    const newTask = await tasks.createTask(taskData);
    console.log('✅ Created task:', newTask);
    taskId = newTask.id;
    
    // Step 5: Test findTaskById
    console.log('\n5. Testing findTaskById...');
    const foundTask = await tasks.findTaskById(taskId);
    console.log('✅ Found task by ID:', foundTask);
    
    // Step 6: Test findAllTasks
    console.log('\n6. Testing findAllTasks...');
    const allTasks = await tasks.findAllTasks();
    console.log(`✅ Found ${allTasks.length} tasks`);
    
    // Step 7: Test createAssignment
    console.log('\n7. Testing createAssignment...');
    // Check if assignment already exists
    const exists = await internTasks.assignmentExists(internId, taskId);
    if (!exists) {
      const newAssignment = await internTasks.createAssignment(internId, taskId);
      console.log('✅ Created assignment:', newAssignment);
      assignmentId = newAssignment.id;
    } else {
      console.log('⚠️ Assignment already exists. Skipping creation.');
      // Get the existing assignment
      const assignments = await internTasks.findAssignmentsByInternId(internId);
      assignmentId = assignments.find(a => a.task_id === taskId).id;
    }
    
    // Step 8: Test findAssignmentsByInternId
    console.log('\n8. Testing findAssignmentsByInternId...');
    const internAssignments = await internTasks.findAssignmentsByInternId(internId);
    console.log(`✅ Found ${internAssignments.length} assignments for intern ID ${internId}:`, internAssignments);
    
    // Step 9: Test findAssignmentById
    console.log('\n9. Testing findAssignmentById...');
    const foundAssignment = await internTasks.findAssignmentById(assignmentId);
    console.log('✅ Found assignment by ID:', foundAssignment);
    
    // Step 10: Test createSubmission
    console.log('\n10. Testing createSubmission...');
    // Check if submission already exists
    const submissionExists = await submissions.submissionExists(assignmentId);
    if (!submissionExists) {
      const newSubmission = await submissions.createSubmission(assignmentId, 'https://github.com/test-user/test-repo');
      console.log('✅ Created submission:', newSubmission);
      submissionId = newSubmission.id;
    } else {
      console.log('⚠️ Submission already exists for this assignment. Skipping creation.');
      // For testing purposes, you can update the submission status
      // Get all submissions for this intern to find the submission ID
      const internSubmissions = await submissions.findSubmissionsByInternId(internId);
      submissionId = internSubmissions[0].id;
    }
    
    // Step 11: Test findSubmissionsByStatus
    console.log('\n11. Testing findSubmissionsByStatus...');
    const pendingSubmissions = await submissions.findSubmissionsByStatus('Pending Review');
    console.log(`✅ Found ${pendingSubmissions.length} pending submissions`);
    
    // Step 12: Test updateSubmissionStatus
    console.log('\n12. Testing updateSubmissionStatus...');
    // First, update to approved
    const approvedSubmission = await submissions.updateSubmissionStatus(submissionId, 'Approved', null, adminUserId);
    console.log('✅ Updated submission status to Approved:', approvedSubmission);
    
    // Then, update to denied with feedback
    const deniedSubmission = await submissions.updateSubmissionStatus(submissionId, 'Denied', 'Need more details in your solution', adminUserId);
    console.log('✅ Updated submission status to Denied:', deniedSubmission);
    
    // Step 13: Test findSubmissionsByInternId
    console.log('\n13. Testing findSubmissionsByInternId...');
    const internSubmissions = await submissions.findSubmissionsByInternId(internId);
    console.log(`✅ Found ${internSubmissions.length} submissions for intern ID ${internId}:`, internSubmissions);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close the connection pool (not needed if your application will continue running)
    // However, for a test script that exits, it's good practice to properly close connections
    const db = require('./utils/db');
    await db.pool.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run the tests
runTests().catch(console.error);