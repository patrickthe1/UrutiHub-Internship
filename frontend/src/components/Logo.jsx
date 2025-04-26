import React from 'react';
import '../App.css'; // Assuming App.css contains the logo styles

function Logo() {
  return (
    <div className="logo-container">
      <span className="logo-uruthi">Uruti</span>
      <span className="logo-hub-wrapper">
        <span className="logo-hub">Hub</span>
      </span>
      <span className="logo-internship">Internship</span> {/* Added Internship part */}
    </div>
  );
}

export default Logo;
