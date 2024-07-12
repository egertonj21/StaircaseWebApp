import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import icon from '../img/backdrop.webp';
import mqtt from 'mqtt';
import Switch from 'react-switch';
import { fetchSensorsAwake, updateSensorsAwake, fetchMute, updateMute } from '../api/api'; // Ensure the path is correct

// Define MQTT topics
const CONTROL_TOPIC = "control/distance_sensor";
const MUTE_TOPIC = "audio/mute";
const MOTION_CONTROL_TOPIC = "control/motion_sensor"; // New topic for motion sensor control

function Header() {
  const [mqttClient, setMqttClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAwake, setIsAwake] = useState(true); // Track the state of the sensor
  const [isMuted, setIsMuted] = useState(false); // Track the state of the mute

  useEffect(() => {
    // Fetch initial sensor status from the API
    fetchSensorsAwake()
      .then(response => {
        console.log('Fetched sensor status:', response.data);
        const sensorStatus = response.data[0]; // Extract the first element from the array
        setIsAwake(sensorStatus.sensors_on === 1);
      })
      .catch(error => {
        console.error('Error fetching sensor status:', error);
      });

    // Fetch initial mute status from the API
    fetchMute()
      .then(response => {
        console.log('Fetched mute status:', response.data);
        const muteStatus = response.data[0]; // Extract the first element from the array
        setIsMuted(muteStatus.mute === 1);
      })
      .catch(error => {
        console.error('Error fetching mute status:', error);
      });

    // Connect to the MQTT broker
    const mqttClient = mqtt.connect('ws://192.168.0.93:8080');

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      setIsConnected(true);
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT connection error:', err);
      setIsConnected(false);
    });

    mqttClient.on('offline', () => {
      console.error('MQTT client went offline');
      setIsConnected(false);
    });

    mqttClient.on('reconnect', () => {
      console.log('Reconnecting to MQTT broker...');
    });

    setMqttClient(mqttClient);

    // WebSocket for receiving initial sensor states
    const ws = new WebSocket('ws://192.168.0.93:8080');
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      ws.send(JSON.stringify({ action: 'get_sensor_status' }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received WebSocket message:', message);
      if (message.type === 'sensor_status') {
        setIsAwake(!!message.awake); // Convert to boolean
        setIsMuted(message.muted);
        console.log('Updated state - awake:', !!message.awake, 'muted:', message.muted);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = (event) => {
      console.error('WebSocket connection closed', event);
      console.error(`Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
    };

    return () => {
      mqttClient.end();
      ws.close();
    };
  }, []);

  // Function to handle awake/asleep toggle
  const handleAwakeToggle = () => {
    if (isConnected && mqttClient) {
      const command = isAwake ? 'sleep' : 'wake';
      console.log(`Publishing command to ${CONTROL_TOPIC}: ${command}`);
      mqttClient.publish(CONTROL_TOPIC, command, (error) => {
        if (error) {
          console.error('Publish error:', error);
        } else {
          console.log(`${command} command sent`);
          setIsAwake(!isAwake); // Toggle the state
        }
      });

      const motionCommand = isAwake ? 'motion_wake' : 'motion_sleep';
      console.log(`Publishing command to ${MOTION_CONTROL_TOPIC}: ${motionCommand}`);
      mqttClient.publish(MOTION_CONTROL_TOPIC, motionCommand, (error) => {
        if (error) {
          console.error('Publish error:', error);
        } else {
          console.log(`${motionCommand} command sent`);
        }
      });

      // Update sensor awake status in the database
      updateSensorsAwake({ sensors_on: isAwake ? 0 : 1 })
        .then(() => {
          console.log('Sensor status updated in database');
        })
        .catch(error => {
          console.error('Error updating sensor status in database:', error);
        });
    } else {
      console.error('MQTT client is not connected');
    }
  };

  // Function to handle mute/unmute toggle
  const handleMuteToggle = () => {
    if (isConnected && mqttClient) {
      const command = isMuted ? 'unmute' : 'mute';
      console.log(`Publishing command to ${MUTE_TOPIC}: ${command}`);
      mqttClient.publish(MUTE_TOPIC, command, (error) => {
        if (error) {
          console.error('Publish error:', error);
        } else {
          console.log(`${command} command sent`);
          setIsMuted(!isMuted); // Toggle the state
        }
      });

      // Update mute status in the database
      updateMute({ muted: isMuted ? 0 : 1 })
        .then(() => {
          console.log('Mute status updated in database');
        })
        .catch(error => {
          console.error('Error updating mute status in database:', error);
        });
    } else {
      console.error('MQTT client is not connected');
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
}

export default Header;
