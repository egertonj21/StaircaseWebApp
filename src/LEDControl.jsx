import React, { useState, useEffect } from 'react';
import Header from "./components/Header";
import Footer from "./components/Footer";

const LEDControl = () => {
    const [ledStrips, setLedStrips] = useState([]);
    const [ranges, setRanges] = useState([]);
    const [colours, setColours] = useState([]);
    const [sensorLights, setSensorLights] = useState([]);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080'); // Replace with your server's address

        socket.onopen = () => {
            console.log('WebSocket connection opened');
            socket.send(JSON.stringify({ action: 'fetch_initial_data' }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = (event) => {
            console.log('WebSocket connection closed', event);
        };

        setWs(socket);

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);

    const handleWebSocketMessage = (data) => {
        console.log('WebSocket message received:', data);
        switch (data.action) {
            case 'fetch_initial_led_data':
                setLedStrips(data.ledStrips || []);
                setRanges(data.ranges || []);
                setColours(data.colours || []);
                setSensorLights(data.sensorLights || []);
                break;
            case 'update_led_strip':
                setLedStrips((prev) =>
                    prev.map((strip) =>
                        strip.LED_strip_ID === data.ledStrip.LED_strip_ID ? data.ledStrip : strip
                    )
                );
                break;
            case 'update_sensor_light':
                setSensorLights((prev) =>
                    prev.map((light) =>
                        light.sensor_light_ID === data.sensorLight.sensor_light_ID ? data.sensorLight : light
                    )
                );
                break;
            default:
                console.error('Unknown action:', data.action);
        }
    };

    const handleLedStripUpdate = (id, data) => {
        if (ws) {
            ws.send(JSON.stringify({ action: 'update_led_strip', id, data }));
        }
    };

    const handleSensorLightUpdate = (LED_strip_ID, range_ID, colour_ID) => {
        if (ws) {
            ws.send(JSON.stringify({ action: 'update_sensor_light', LED_strip_ID, range_ID, colour_ID }));
        }
    };

    return (
        <div>
            <Header />
            {ledStrips.map((ledStrip) => (
                <div key={ledStrip.LED_strip_ID}>
                    <h2>LED Strip: {ledStrip.LED_strip_name}</h2>
                    <div>
                        <label>Overall Colour: </label>
                        <select
                            onChange={(e) => handleLedStripUpdate(ledStrip.LED_strip_ID, { colour_ID: e.target.value })}
                        >
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
                                onChange={(e) => handleSensorLightUpdate(ledStrip.LED_strip_ID, range.range_ID, e.target.value)}
                            >
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
            <Footer />
        </div>
    );
};

export default LEDControl;
