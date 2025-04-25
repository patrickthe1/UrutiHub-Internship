import React from 'react';
import { Routes, Route, Link } from 'react-router-dom'; // Import Routes, Route, Link
import './App.css' // Keep existing styles if needed

// Import your placeholder components
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <div className="App">
      <nav>
        {/* Optional: Add basic navigation links for easy testing */}
        <Link to="/signup">Signup</Link> |{" "}
        <Link to="/login">Login</Link> |{" "}
        <Link to="/welcome">Welcome (Placeholder)</Link>
      </nav>

      <Routes>
        {/* Define routes */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        {/* Add a root route that redirects or points to login/signup */}
        <Route path="/" element={<LoginPage />} /> {/* Default to LoginPage */}
        {/* 404 Catch-all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
