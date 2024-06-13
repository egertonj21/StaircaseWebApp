import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import backgroundImage from './img/background3.webp';

const SensorLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data);
      setLogs(data);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <>
      <Header />
      <div className="container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <h2>Sensor Logs</h2>
        <table>
          <thead>
            <tr>
              {/* <th>Sensor ID</th> */}
              <th>Sensor Name</th>
              <th>Distance</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.SensorID}>
                {/* <td>{log.SensorID}</td> */}
                <td>{log.SensorName}</td>
                <td>{log.Distance}</td>
                <td>{new Date(log.Timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </>
  );
};

export default SensorLogs;
