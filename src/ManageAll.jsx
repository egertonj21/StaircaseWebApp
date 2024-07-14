import React, { useState, useEffect } from 'react';
import api, { 
    fetchSensors, 
    fetchLedStrips, 
    updateLedStrip, 
    updateSensorLight, 
    createSensorLight, 
    fetchRanges, 
    fetchLightDurations, 
    fetchColours, 
    fetchSensorLights, 
    updateLightDuration 
} from "./api/api";
import Header from "./components/Header";
import Footer from "./components/Footer";

const ManageDevices = () => {
    const [sensors, setSensors] = useState([]);
    const [ledStrips, setLedStrips] = useState([]);
    const [ranges, setRanges] = useState([]);
    const [lightDurations, setLightDurations] = useState([]);
    const [colours, setColours] = useState([]);
    const [sensorLights, setSensorLights] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sensorData = await fetchSensors();
                const ledStripData = await fetchLedStrips();
                const rangeData = await fetchRanges();
                const lightDurationData = await fetchLightDurations();
                const colourData = await fetchColours();
                const sensorLightData = await fetchSensorLights();

                setSensors(sensorData.data);
                setLedStrips(ledStripData.data);
                setRanges(rangeData.data);
                setLightDurations(lightDurationData.data);
                setColours(colourData.data);
                setSensorLights(sensorLightData.data);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    const handleLedStripUpdate = async (id, data) => {
        try {
            await updateLedStrip(id, data);
            alert("LED strip updated successfully!");
            const ledStripData = await fetchLedStrips();
            setLedStrips(ledStripData.data);
        } catch (error) {
            console.error("Failed to update LED strip", error);
            alert("Failed to update LED strip");
        }
    };

    const handleSensorLightUpdate = async (LED_strip_ID, range_ID, colour_ID) => {
        try {
            await updateSensorLight(LED_strip_ID, range_ID, { colour_ID });
            alert("Sensor light updated successfully!");
            const sensorLightData = await fetchSensorLights();
            setSensorLights(sensorLightData.data);
        } catch (error) {
            console.error("Failed to update sensor light", error);
            alert("Failed to update sensor light");
        }
    };

    return (
        <div>
            <Header />
            {ledStrips.map((ledStrip, index) => (
                <div key={ledStrip.LED_strip_ID}>
                    <h2>LED Strip: {ledStrip.LED_strip_name}</h2>
                    <div>
                        <label>Overall Colour: </label>
                        <select 
                            onChange={(e) => handleLedStripUpdate(ledStrip.LED_strip_ID, { ...ledStrip, colour_ID: e.target.value })}>
                            <option value="">Select Colour</option>
                            {colours.map((colour) => (
                                <option key={colour.colour_ID} value={colour.colour_ID}>
                                    {colour.colour_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {ranges.map((range) => (
                        <div key={range.range_ID}>
                            <label>Range {range.range_name} Colour: </label>
                            <select 
                                onChange={(e) => handleSensorLightUpdate(ledStrip.LED_strip_ID, range.range_ID, e.target.value)}>
                                <option value="">Select Colour</option>
                                {colours.map((colour) => (
                                    <option key={colour.colour_ID} value={colour.colour_ID}>
                                        {colour.colour_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            ))}
            {sensors.map((sensor, index) => (
                <div key={sensor.sensor_ID}>
                    <h2>Sensor: {sensor.sensor_name}</h2>
                    {ranges.map((range) => (
                        <div key={range.range_ID}>
                            <label>Range {range.range_name} Tone: </label>
                            <input 
                                type="text" 
                                onChange={(e) => handleSensorLightUpdate(sensor.sensor_ID, range.range_ID, e.target.value)} 
                            />
                        </div>
                    ))}
                </div>
            ))}
            {sensorLights.map((sensorLight, index) => (
                <div key={sensorLight.sensor_light_ID}>
                    <h2>Sensor Light ID: {sensorLight.sensor_light_ID}</h2>
                    <div>
                        <label>Sensor ID: {sensorLight.sensor_ID}</label>
                    </div>
                    <div>
                        <label>LED Strip ID: {sensorLight.LED_strip_ID}</label>
                    </div>
                    <div>
                        <label>Range ID: {sensorLight.range_ID}</label>
                    </div>
                    <div>
                        <label>Colour ID: {sensorLight.colour_ID}</label>
                    </div>
                </div>
            ))}
            <Footer />
        </div>
    );
};

export default ManageDevices;
