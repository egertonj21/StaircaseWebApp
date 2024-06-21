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
// import './styles.css';

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
        setSensors(sensorsRes.data);
        setActions(actionsRes.data);
        setRanges(rangesRes.data);
        setNotes(notesRes.data);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
    fetchData();

    // WebSocket connection setup
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("WebSocket connection opened");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update-outputs" && data.sensor_ID === selectedSensor) {
        setCurrentSettings(data.range_outputs);
      } else if (data.type === "update-range") {
        setRanges((prevRanges) =>
          prevRanges.map((range) =>
            range.range_ID === data.range_ID
              ? { ...range, lower_limit: data.lower_limit, upper_limit: data.upper_limit }
              : range
          )
        );
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = (event) => {
      console.log("WebSocket connection closed", event);
    };

    setWs(socket);

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [selectedSensor]);

  const handleSensorChange = async (sensorId) => {
    setSelectedSensor(sensorId);
    if (sensorId) {
      try {
        const response = await fetchCurrentSettings(sensorId);
        setCurrentSettings(response.data);
      } catch (error) {
        console.error("Error fetching current settings", error);
      }
    } else {
      setCurrentSettings([]);
    }
  };

  const handleRangeOutputChange = (range_ID, note_ID) => {
    setRangeOutputs((prevState) => {
      const newState = [...prevState];
      const index = newState.findIndex((ro) => ro.range_ID === range_ID);
      if (index > -1) {
        newState[index] = { ...newState[index], note_ID };
      } else {
        newState.push({ range_ID, note_ID });
      }
      return newState;
    });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        sensor_ID: selectedSensor,
        range_outputs: rangeOutputs.map(ro => ({
          range_ID: ro.range_ID,
          note_ID: ro.note_ID
        }))
      };

      await updateSelectedOutputs(data);
      alert("Selected outputs updated successfully");
      handleSensorChange(selectedSensor); // Refresh current settings
    } catch (error) {
      console.error("Error updating selected outputs", error);
      alert("Failed to update selected outputs");
    }
  };

  const getNoteNameById = (noteId) => {
    const note = notes.find(n => n.note_ID === noteId);
    return note ? note.note_name : "None";
  };

  return (
    <>
      <Header />
      <div className="container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <h2>Outputs</h2>
        <div className="form-group">
          <label className="label">Sensor:</label>
          <select
            value={selectedSensor}
            onChange={(e) => handleSensorChange(e.target.value)}
          >
            <option value="">Select a sensor</option>
            {sensors.map((sensor) => (
              <option key={sensor.sensor_ID} value={sensor.sensor_ID}>
                {sensor.sensor_name}
              </option>
            ))}
          </select>
        </div>
        {ranges.map((range) => {
          const setting = currentSettings.find(
            (cs) => cs.range_ID === range.range_ID
          );
          return (
            <div key={range.range_ID} className="form-group">
              <label className="label">
                {range.range_name} (Current:{" "}
                {setting ? getNoteNameById(setting.note_ID) : "None"}):
              </label>
              <select
                onChange={(e) =>
                  handleRangeOutputChange(range.range_ID, e.target.value)
                }
                defaultValue={setting ? setting.note_ID : ""}
              >
                <option value="">Select a note</option>
                {notes.map((note) => (
                  <option key={note.note_ID} value={note.note_ID}>
                    {note.note_name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
        <button onClick={handleSubmit}>Update Selected Outputs</button>
      </div>
      <Footer />
    </>
  );
};

export default Outputs;
