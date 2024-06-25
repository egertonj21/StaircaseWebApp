import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000'
});

// Fetch the list of sensors
export const fetchSensors = () => api.get('/sensors');

// Fetch actions from the action_table
export const fetchActions = () => api.get('/actions');

// Fetch range settings
export const fetchRanges = () => api.get('/ranges');

// Fetch notes including their locations
export const fetchNotes = () => api.get('/notes');

// Fetch current settings for a selected sensor
export const fetchCurrentSettings = (sensorId) => api.get(`/selected-output/${sensorId}`);

// Update selected outputs for a sensor
export const updateSelectedOutputs = (sensorId, data) => api.post(`/selected-output/${sensorId}`, data);

// Update range settings for a given range
export const updateRangeSettings = (rangeId, data) => api.put(`/range/${rangeId}`, data);

// Fetch note details based on sensor and range ID
export const fetchNoteDetails = (sensorId, rangeId) => api.get(`/note-details/${sensorId}/${rangeId}`);

// Log sensor data
export const logSensorData = (data) => api.post('/log-sensor-data', data);

// Fetch logs
export const fetchLogs = () => api.get('/logs');

export default api;
