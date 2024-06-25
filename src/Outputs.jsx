import React, { useState, useEffect } from "react";
import {
  fetchSensors,
  fetchActions,
  fetchRanges,
  fetchNotes,
  fetchCurrentSettings,
  updateSelectedOutputs,
} from "./api/api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import backgroundImage from './img/background2.webp';

const Outputs = () => {
  const [sensors, setSensors] = useState([]);
  const [actions, setActions] = useState([]);
  const [ranges, setRanges] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [rangeOutputs, setRangeOutputs] = useState([]);
  const [currentSettings, setCurrentSettings] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorsRes, actionsRes, rangesRes, notesRes] = await Promise.all([
          fetchSensors(),
          fetchActions(),
          fetchRanges(),
          fetchNotes(),
        ]);
        setSensors(sensorsRes.data || []);
        setActions(actionsRes.data || []);
        setRanges(rangesRes.data || []);
        setNotes(notesRes.data || []);
        console.log("Data fetched successfully");
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
    fetchData();

    const socket = new WebSocket("ws://localhost:8080");
    socket.onopen = () => console.log("WebSocket connection opened");
    socket.onmessage = event => handleWebSocketMessage(JSON.parse(event.data));
    socket.onerror = error => console.error("WebSocket error:", error);
    socket.onclose = () => console.log("WebSocket connection closed");
    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const handleWebSocketMessage = data => {
    console.log("WebSocket message received:", data);
    if (data.type === "update-outputs" && data.sensor_ID === selectedSensor) {
      setCurrentSettings(data.range_outputs || []);
      setRangeOutputs(data.range_outputs || []);
    } else if (data.type === "update-range") {
      setRanges(prevRanges => prevRanges.map(range =>
        range.range_ID === data.range_ID ? { ...range, ...data } : range
      ));
    }
  };

  const handleSensorChange = (sensorId) => {
    setSelectedSensor(sensorId);
    if (sensorId) {
      fetchCurrentSettings(sensorId)
        .then(response => {
          setCurrentSettings(response.data || []);
          setRangeOutputs(response.data || []);
          console.log("Current settings fetched successfully for sensor:", sensorId);
        })
        .catch(error => console.error("Failed to fetch settings:", error));
    } else {
      setCurrentSettings([]);
      setRangeOutputs([]);
    }
  };

  const handleRangeOutputChange = (range_ID, note_ID) => {
    setRangeOutputs(prev => {
      const index = prev.findIndex(ro => ro.range_ID === range_ID);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], note_ID };
        return updated;
      } else {
        return [...prev, { range_ID, note_ID }];
      }
    });
    setCurrentSettings(prev => {
      const index = prev.findIndex(cs => cs.range_ID === range_ID);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], note_ID };
        return updated;
      } else {
        return [...prev, { range_ID, note_ID }];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedSensor) {
      const data = { range_outputs: rangeOutputs };
      console.log("Submitting data:", data);
      try {
        await updateSelectedOutputs(selectedSensor, data);
        alert("Selected outputs updated successfully");
      } catch (error) {
        console.error("Error updating outputs:", error);
        alert("Failed to update selected outputs");
      }
    } else {
      alert("No sensor selected");
    }
  };

  const getNoteNameById = noteId => {
    const note = notes.find(n => n.note_ID === noteId);
    return note ? note.note_name : "None";
  };

  return (
    <>
      <Header />
      <div className="container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <h2>Outputs</h2>
        <div className="form-group">
          <label>Sensor:</label>
          <select value={selectedSensor} onChange={e => handleSensorChange(e.target.value)}>
            <option value="">Select a sensor</option>
            {Array.isArray(sensors) && sensors.map(sensor => (
              <option key={sensor.sensor_ID} value={sensor.sensor_ID}>{sensor.sensor_name}</option>
            ))}
          </select>
        </div>
        {Array.isArray(ranges) && ranges.map(range => (
          <div key={range.range_ID} className="form-group">
            <label>
              {range.range_name} (Current: {getNoteNameById(currentSettings.find(cs => cs.range_ID === range.range_ID)?.note_ID)}):
            </label>
            <select onChange={e => handleRangeOutputChange(range.range_ID, e.target.value)}
                    value={currentSettings.find(cs => cs.range_ID === range.range_ID)?.note_ID || ""}>
              <option value="">Select a note</option>
              {Array.isArray(notes) && notes.map(note => (
                <option key={note.note_ID} value={note.note_ID}>{note.note_name}</option>
              ))}
            </select>
          </div>
        ))}
        <button onClick={handleSubmit}>Update Selected Outputs</button>
      </div>
      <Footer />
    </>
  );
};

export default Outputs;
