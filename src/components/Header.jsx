import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import icon from '../img/backdrop.webp';
import Switch from 'react-switch';

const Header = () => {
  const [wsClient, setWsClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAwake, setIsAwake] = useState(true); // Track the state of the sensor
  const [isMuted, setIsMuted] = useState(false); // Track the state of the mute

  useEffect(() => {
    // Connect to the WebSocket server
    const ws = new WebSocket('ws://localhost:8080'); // Replace with your server's IP address

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      ws.send(JSON.stringify({ action: 'get_sensor_status' })); // Request initial sensor status
      ws.send(JSON.stringify({ action: 'get_mute_status' })); // Request initial mute status
    };

    ws.onmessage = (event) => {
      try {
        console.log('WebSocket message received:', event.data);
        const data = JSON.parse(event.data);
        if (data.action === 'get_sensor_status') {
          setIsAwake(data.data.sensors_on === 1);
        } else if (data.action === 'get_mute_status') {
          setIsMuted(data.data.mute === 1);
        } else if (data.action === 'update_sensor_status') {
          setIsAwake(data.data.sensors_on === 1);
        } else if (data.action === 'update_mute_status') {
          setIsMuted(data.data.mute === 1);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWsClient(ws);

    return () => {
      ws.close();
    };
  }, []);

  // Function to handle awake/asleep toggle
  const handleAwakeToggle = () => {
    if (isConnected && wsClient) {
      const command = isAwake ? 'sleep' : 'wake';
      console.log(`Sending command via WebSocket: ${command}`);
      wsClient.send(JSON.stringify({ action: 'control_sensor', command }));

      const motionCommand = isAwake ? 'motion_sleep' : 'motion_wake';
      console.log(`Sending command via WebSocket: ${motionCommand}`);
      wsClient.send(JSON.stringify({ action: 'control_motion', command: motionCommand }));

      // Update sensor awake status in the database
      wsClient.send(JSON.stringify({ action: 'update_sensor_status', payload: { sensors_on: isAwake ? 0 : 1 } }));
    } else {
      console.error('WebSocket client is not connected');
    }
  };

  // Function to handle mute/unmute toggle
  const handleMuteToggle = () => {
    if (isConnected && wsClient) {
      const command = isMuted ? 'unmute' : 'mute';
      console.log(`Sending command via WebSocket: ${command}`);
      wsClient.send(JSON.stringify({ action: 'control_mute', command }));

      // Update mute status in the database
      wsClient.send(JSON.stringify({ action: 'update_mute_status', payload: { mute: isMuted ? 0 : 1 } }));
    } else {
      console.error('WebSocket client is not connected');
    }
  };

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
        <Link to="/Ranges">Range Settings</Link>
        <Link to="/ManageAll">Manage Devices</Link>
        <div className="toggle-container">
          <label className="toggle-label">Sensors</label>
          <Switch
            onChange={handleAwakeToggle}
            checked={isAwake}
            offColor="#888"
            onColor="#0f0"
            uncheckedIcon={false}
            checkedIcon={false}
          />
          <span className="toggle-status">{isAwake ? 'Awake' : 'Asleep'}</span>
        </div>
        <div className="toggle-container">
          <label className="toggle-label">Mute</label>
          <Switch
            onChange={handleMuteToggle}
            checked={isMuted}
            offColor="#888"
            onColor="#f00"
            uncheckedIcon={false}
            checkedIcon={false}
          />
          <span className="toggle-status">{isMuted ? 'Muted' : 'Unmuted'}</span>
        </div>
      </nav>
    </div>
  );
};

export default Header;
