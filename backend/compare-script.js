
const bcrypt = require('bcrypt');

const passwordYouAreTyping = 'password123'; // <-- Replace with the password you are typing
const hashFromDatabase = '$2b$10$zYBrTXK3eI0aPlPXPNDlmeHJgSsg5wVgRz30FtiO4aoJwMWZzlXAW'; // <-- Our newly generated hash

bcrypt.compare(passwordYouAreTyping, hashFromDatabase, (err, result) => {
  if (err) {
    console.error('Error comparing passwords:', err);
  } else {
    console.log('Password comparison result (true means match):', result);
  }
});