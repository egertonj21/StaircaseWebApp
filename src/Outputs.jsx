// src/components/Outputs.js
import React, { useState, useEffect } from "react";
import {
  fetchSensors,
  fetchOutputs,
  fetchRanges,
  fetchCurrentSettings,
  updateSelectedOutputs,
} from "./api/api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import backgroundImage from './img/background2.webp';
// import './styles.css';

const Outputs = () => {
  const [sensors, setSensors] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [ranges, setRanges] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [rangeOutputs, setRangeOutputs] = useState([]);
  const [currentSettings, setCurrentSettings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorsRes, outputsRes, rangesRes] = await Promise.all([
          fetchSensors(),
          fetchOutputs(),
          fetchRanges(),
        ]);
        setSensors(sensorsRes.data);
        setOutputs(outputsRes.data);
        setRanges(rangesRes.data);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
    fetchData();
  }, []);

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

  const handleRangeOutputChange = (range_id, output_id) => {
    setRangeOutputs((prevState) => {
      const newState = [...prevState];
      const index = newState.findIndex((ro) => ro.range_id === range_id);
      if (index > -1) {
        newState[index] = { range_id, output_id };
      } else {
        newState.push({ range_id, output_id });
      }
      return newState;
    });
  };

  const handleSubmit = async () => {
    try {
      await updateSelectedOutputs({
        sensor_id: selectedSensor,
        range_outputs: rangeOutputs,
      });
      alert("Selected outputs updated successfully");
      handleSensorChange(selectedSensor); // Refresh current settings
    } catch (error) {
      console.error("Error updating selected outputs", error);
      alert("Failed to update selected outputs");
    }
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
              <option key={sensor.id} value={sensor.id}>
                {sensor.sensorName}
              </option>
            ))}
          </select>
        </div>
        {ranges.map((range) => {
          const setting = currentSettings.find(
            (cs) => cs.range_id === range.range_id
          );
          return (
            <div key={range.range_id} className="form-group">
              <label className="label">
                {range.range_name} (Current:{" "}
                {setting ? setting.OutputName : "None"}):
              </label>
              <select
                onChange={(e) =>
                  handleRangeOutputChange(range.range_id, e.target.value)
                }
                defaultValue={setting ? setting.output_id : ""}
              >
                <option value="">Select an output</option>
                {outputs.map((output) => (
                  <option key={output.id} value={output.id}>
                    {output.OutputName}
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
