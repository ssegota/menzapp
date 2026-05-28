// Single wrapper around `fetch` so every API call carries the Time
// Travel widget's mocked time to the server via `x-mock-time`. Without
// this, the server middleware silently falls back to real time and
// gating logic (ordering window, cancellation, date comparisons) runs
// against `new Date()` instead of the time the user sees in the UI.
//
// The widget persists the mocked time to localStorage on every change,
// which makes it readable from any module without prop-drilling.

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const apiFetch = (url, options = {}) => {
    const mock = localStorage.getItem('mockTime');
    const headers = { ...(options.headers || {}) };
    if (mock) headers['x-mock-time'] = mock;
    return fetch(url, { ...options, headers });
};
