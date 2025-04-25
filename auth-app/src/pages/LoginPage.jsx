import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import Logo from '../components/Logo'; // Import the Logo component

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false); // State to track if the message is an error

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      const response = await axios.post('http://localhost:5000/login', {
        email,
        password
      });

      console.log('Login successful:', response.data);
      setMessage('Login successful! Redirecting...');
      setIsError(false);
      setEmail('');
      setPassword('');

      // Add a class for fade-out effect before navigation
      document.querySelector('.auth-card').classList.add('fade-out');

      setTimeout(() => {
        navigate('/dashboard'); // Navigate to the dashboard
      }, 500); // Match timeout with fade-out duration

    } catch (error) {
      setIsError(true);
      if (error.response) {
        console.error('Login error response:', error.response.data);
        setMessage(error.response.data.message || 'Login failed. Invalid credentials.');
      } else if (error.request) {
        console.error('Login error request:', error.request);
        setMessage('No response from server. Please try again.');
      } else {
        console.error('Login error message:', error.message);
        setMessage('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="auth-container">
      {/* Add fade-in class */}
      <div className="auth-card fade-in">
        <Logo /> {/* Use the Logo component */} 
        {/* Removed the h1 and h2 here as Logo includes branding */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} aria-hidden="true" />
              <input
                type="email"
                id="login-email"
                className={`input-field ${isError ? 'input-error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                aria-label="Email Address"
                aria-required="true"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} aria-hidden="true" />
              <input
                type="password"
                id="login-password"
                className={`input-field ${isError ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                aria-label="Password"
                aria-required="true"
              />
            </div>
          </div>
          {/* Add aria-live for screen readers to announce messages */}
          {message && <p className={`message-area ${isError ? 'error-message' : 'success-message'}`} role="alert" aria-live="assertive">{message}</p>} {/* Display message */}
          <button type="submit" className="submit-btn">Sign In</button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
