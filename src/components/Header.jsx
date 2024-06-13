import React from "react";
import { Link } from "react-router-dom";
import icon from '../img/backdrop.webp';

function Header() {
  return (
    <div className="header">
      <div className="header-top">
        <div className="icon">
          <img src={icon} alt="Staircase Icon" className="header-icon" />
        </div>
        <div className="header-title">
          <h1>Musical Staircase</h1>
        </div>
        <div className="icon">
          <img src={icon} alt="Staircase Icon" className="header-icon" />
        </div>
      </div>
      <nav className="header-nav">
        <Link to="/">Home</Link>
        <Link to="/SensorLogs">Sensor Logs</Link>
        <Link to="/About">About</Link>
        <Link to="/Outputs">Outputs</Link>
      </nav>
    </div>
  );
}

export default Header;
