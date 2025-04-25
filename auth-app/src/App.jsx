import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Import Navigate
import './App.css'

// Import your page components
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard'; // Updated import
import NotFoundPage from './pages/NotFoundPage';

function App() {
  // Basic mock auth state - in a real app, this would be more robust (context, redux, etc.)
  // For now, let's assume login sets something in localStorage or state.
  // We'll simulate this by just having the routes.

  return (
    <div className="App-container"> {/* Use a different class to avoid conflict with App.css #root */}
      {/* Remove the test navigation links */}
      {/* <nav>
        <Link to="/signup">Signup</Link> |{" "}
        <Link to="/login">Login</Link> |{" "}
        <Link to="/dashboard">Dashboard</Link>
      </nav> */}

      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Updated route path */}
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* 404 Catch-all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
