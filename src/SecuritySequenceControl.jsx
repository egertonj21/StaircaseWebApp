import React, { useState, useEffect } from 'react';
import Header from "./components/Header";
import Footer from "./components/Footer";

const SecuritySequenceControl = () => {
    const [sequences, setSequences] = useState([]);
    const [positions, setPositions] = useState([]);
    const [newSequence, setNewSequence] = useState({ direction: 'up', step1_position_ID: '', step2_position_ID: '', step3_position_ID: '' });
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080'); // Replace with your server's address

        socket.onopen = () => {
            console.log('WebSocket connection opened');
            socket.send(JSON.stringify({ action: 'fetchAllSecuritySequences' }));
            socket.send(JSON.stringify({ action: 'fetchAllPositions' }));
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
            case 'fetchAllSecuritySequences':
                setSequences(data.data || []);
                break;
            case 'fetchAllPositions':
                setPositions(data.data || []);
                break;
            case 'addSecuritySequence':
            case 'updateSecuritySequence':
            case 'deleteSecuritySequence':
                // Refetch sequences after an operation
                ws.send(JSON.stringify({ action: 'fetchAllSecuritySequences' }));
                break;
            default:
                console.error('Unknown action:', data.action);
        }
    };

    const handleAddSequence = () => {
        if (ws) {
            ws.send(JSON.stringify({ action: 'addSecuritySequence', payload: newSequence }));
            setNewSequence({ direction: 'up', step1_position_ID: '', step2_position_ID: '', step3_position_ID: '' });
        }
    };

    const handleDeleteSequence = (sequence_ID) => {
        if (ws) {
            ws.send(JSON.stringify({ action: 'deleteSecuritySequence', payload: { sequence_ID } }));
        }
    };

    const handleUpdateSequence = (sequence_ID, updatedSequence) => {
        if (ws) {
            ws.send(JSON.stringify({ action: 'updateSecuritySequence', payload: { ...updatedSequence, sequence_ID } }));
        }
    };

    const handleInputChange = (e, field) => {
        setNewSequence({ ...newSequence, [field]: e.target.value });
    };

    return (
        <div>
            <Header />
            <div>
                <h2>Add New Security Sequence</h2>
                <div>
                    <label>Direction:</label>
                    <select value={newSequence.direction} onChange={(e) => handleInputChange(e, 'direction')}>
                        <option value="up">Up</option>
                        <option value="down">Down</option>
                    </select>
                </div>
                <div>
                    <label>Step 1 Position:</label>
                    <select
                        value={newSequence.step1_position_ID}
                        onChange={(e) => handleInputChange(e, 'step1_position_ID')}
                    >
                        <option value="">Select Position</option>
                        {positions.map((position) => (
                            <option key={position.position_ID} value={position.position_ID}>
                                {position.position_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Step 2 Position:</label>
                    <select
                        value={newSequence.step2_position_ID}
                        onChange={(e) => handleInputChange(e, 'step2_position_ID')}
                    >
                        <option value="">Select Position</option>
                        {positions.map((position) => (
                            <option key={position.position_ID} value={position.position_ID}>
                                {position.position_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Step 3 Position:</label>
                    <select
                        value={newSequence.step3_position_ID}
                        onChange={(e) => handleInputChange(e, 'step3_position_ID')}
                    >
                        <option value="">Select Position</option>
                        {positions.map((position) => (
                            <option key={position.position_ID} value={position.position_ID}>
                                {position.position_name}
                            </option>
                        ))}
                    </select>
                </div>
                <button onClick={handleAddSequence}>Add Sequence</button>
            </div>

            <div>
                <h2>Existing Security Sequences</h2>
                {sequences.map((sequence) => (
                    <div key={sequence.sequence_ID}>
                        <h3>Sequence ID: {sequence.sequence_ID}</h3>
                        <p>Direction: {sequence.direction}</p>
                        <p>Step 1 Position: {sequence.step1_position_ID}</p>
                        <p>Step 2 Position: {sequence.step2_position_ID}</p>
                        <p>Step 3 Position: {sequence.step3_position_ID}</p>
                        <button onClick={() => handleDeleteSequence(sequence.sequence_ID)}>Delete</button>
                        <button onClick={() => handleUpdateSequence(sequence.sequence_ID, {
                            direction: 'up', // Replace with the actual value you want to update
                            step1_position_ID: sequence.step1_position_ID,
                            step2_position_ID: sequence.step2_position_ID,
                            step3_position_ID: sequence.step3_position_ID
                        })}>Update</button>
                    </div>
                ))}
            </div>
            <Footer />
        </div>
    );
};

export default SecuritySequenceControl;
