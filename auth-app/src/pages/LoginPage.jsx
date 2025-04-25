import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { Mail, Lock } from 'lucide-react'; // Import icons

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

      setTimeout(() => {
        navigate('/welcome'); // Navigate to the mock dashboard
      }, 1500);

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
      <div className="auth-card">
        <h1>Uruti Hub Internship</h1>
        <h2>Sign In</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="login-email"
                className={`input-field ${isError ? 'input-error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                id="login-password"
                className={`input-field ${isError ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          {message && <p className={`error-message ${isError ? '' : 'success-message'}`}>{message}</p>} {/* Display message */}
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
