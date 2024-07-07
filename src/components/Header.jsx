import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import icon from '../img/backdrop.webp';
import mqtt from 'mqtt';
import Switch from 'react-switch';

const CONTROL_TOPIC = "control/distance_sensor";

function Header() {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAwake, setIsAwake] = useState(true); // Track the state of the sensor

  useEffect(() => {
    // Connect to the MQTT broker via WebSocket
    const mqttClient = mqtt.connect('ws://192.168.0.93:8080');

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      setIsConnected(true);
    });

    mqttClient.on('error', (err) => {
      console.error('Connection error: ', err);
      setIsConnected(false);
    });

    mqttClient.on('offline', () => {
      console.error('MQTT client went offline');
      setIsConnected(false);
    });

    mqttClient.on('reconnect', () => {
      console.log('Reconnecting to MQTT broker...');
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  // Function to handle toggle
  const handleToggle = () => {
    if (isConnected && client) {
      const command = isAwake ? 'sleep' : 'wake';
      client.publish(CONTROL_TOPIC, command, (error) => {
        if (error) {
          console.error('Publish error: ', error);
        } else {
          console.log(`${command} command sent`);
          setIsAwake(!isAwake); // Toggle the state
        }
      });
    } else {
      console.error('Client is not connected');
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
        <div className="toggle-container">
          <label className="toggle-label">Sensors</label>
          <Switch
            onChange={handleToggle}
            checked={isAwake}
            offColor="#888"
            onColor="#0f0"
            uncheckedIcon={false}
            checkedIcon={false}
          />
          <span className="toggle-status">{isAwake ? 'Awake' : 'Asleep'}</span>
        </div>
      </nav>
    </div>
  );
}

export default Header;
