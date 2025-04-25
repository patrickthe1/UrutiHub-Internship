import React, { useState } from 'react';
import axios from 'axios'; // Import axios
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // State for displaying feedback messages

  const navigate = useNavigate(); // Initialize navigate hook

  const handleSubmit = async (e) => { // Make the function async
    e.preventDefault();
    setMessage(''); // Clear previous messages

    try {
      const response = await axios.post('http://localhost:5000/signup', {
        email,
        password
      });

      
      setMessage(response.data.message); 
      // Optional: Clear form fields
      setEmail('');
      setPassword('');

      // Redirect to login page after a short delay (optional, or just redirect immediately)
      setTimeout(() => {
         navigate('/login');
      }, 1000); // Redirect after 1 second

    } catch (error) {
      // Handle error response
      if (error.response) {
        // Server responded with a status code outside 2xx
        console.error('Signup error response:', error.response.data);
        setMessage(error.response.data.message || 'Signup failed.'); // Display backend error message
      } else if (error.request) {
        // Request was made but no response received
        console.error('Signup error request:', error.request);
        setMessage('No response from server. Please try again.');
      } else {
        // Something else happened
        console.error('Signup error message:', error.message);
        setMessage('An unexpected error occurred.');
      }
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="signup-email">Email:</label> {/* Use unique IDs */}
          <input
            type="email"
            id="signup-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="signup-password">Password:</label> {/* Use unique IDs */}
          <input
            type="password"
            id="signup-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      {message && <p style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>} 
    </div>
  );
}

export default SignupPage;
