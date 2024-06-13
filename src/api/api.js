// src/api/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000'
});

export const fetchSensors = () => api.get('/sensors');
export const fetchOutputs = () => api.get('/outputs');
export const fetchRanges = () => api.get('/ranges');
export const fetchCurrentSettings = (sensorId) => api.get(`/selected-output/${sensorId}`);
export const updateSelectedOutputs = (data) => api.post('/selected-output', data);
