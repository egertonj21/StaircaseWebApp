import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import SensorLogs from './SensorLogs';
import Outputs from './Outputs';
import About from './About';
import Ranges from './Ranges'
import ManageAll from './LEDControl'
import LEDControl from './LEDControl';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/Outputs" element={<Outputs />} />
        <Route path="/About" element={<About />} />
        <Route path="/LEDControl" element={<LEDControl />} />
        <Route path="/SensorLogs" element={<SensorLogs />} />
        <Route path="/Ranges" element={<Ranges />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  </React.StrictMode>
);
