import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000'
});

export const fetchSensors = () => api.get('/sensors');
export const fetchActions = () => api.get('/actions'); // Updated to fetch actions from action_table
export const fetchRanges = () => api.get('/ranges');
export const fetchCurrentSettings = (sensorId) => api.get(`/selected-output/${sensorId}`);
export const updateSelectedOutputs = (data) => api.post('/selected-output', data);
export const updateRangeSettings = (rangeId, data) => api.put(`/range/${rangeId}`, data);

export default api;
