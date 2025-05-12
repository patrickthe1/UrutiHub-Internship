const bcrypt = require('bcrypt');

const plainTextPassword = 'password123';
const saltRounds = 10;

// Generate a new hash
bcrypt.hash(plainTextPassword, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
  } else {
    console.log('Generated hash for password123:', hash);
    
    // Verify the hash
    bcrypt.compare(plainTextPassword, hash, (err, result) => {
      if (err) {
        console.error('Error comparing passwords:', err);
      } else {
        console.log('Password verification result (should be true):', result);
      }
    });
  }
});
