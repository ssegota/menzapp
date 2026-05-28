import React, { useState, useEffect } from 'react';
import { apiFetch, API_BASE } from '../api';

const TimeWidget = ({ onTimeChange }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    // `null` = haven't asked the server yet; render nothing until we know.
    // Prevents the widget from flashing in then disappearing once settings
    // arrive.
    const [enabled, setEnabled] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await apiFetch(`${API_BASE}/api/settings`);
                const data = await res.json();
                const on = data && data.timeTravelEnabled !== false;
                setEnabled(on);
                if (!on) {
                    // Widget disabled in prod — drop any leftover mocked time
                    // so apiFetch stops sending x-mock-time on subsequent calls.
                    localStorage.removeItem('mockTime');
                    onTimeChange(new Date());
                }
            } catch (err) {
                // If settings can't be fetched, default to showing the widget
                // so devs aren't locked out by a backend hiccup.
                setEnabled(true);
            }
        })();
    }, []);

    useEffect(() => {
        if (!enabled) return;
        // Initial load from local storage or current time
        const stored = localStorage.getItem('mockTime');
        if (stored) {
            const d = new Date(stored);
            setDate(d.toISOString().split('T')[0]);
            setTime(d.toTimeString().split(' ')[0].substring(0, 5));
            onTimeChange(d);
        } else {
            const now = new Date();
            setDate(now.toISOString().split('T')[0]);
            setTime(now.toTimeString().split(' ')[0].substring(0, 5));
            onTimeChange(now);
        }
    }, [enabled]);

    const handleUpdate = (newDate, newTime) => {
        if (newDate && newTime) {
            const d = new Date(`${newDate}T${newTime}`);
            localStorage.setItem('mockTime', d.toISOString());
            onTimeChange(d);
        }
    };

    if (!enabled) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'white',
            padding: '15px',
            borderRadius: '20px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            border: '2px solid #fad0c4',
            zIndex: 1000
        }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ff9a9e' }}>🕒 Time Travel</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                        setDate(e.target.value);
                        handleUpdate(e.target.value, time);
                    }}
                />
                <input
                    type="time"
                    value={time}
                    onChange={(e) => {
                        setTime(e.target.value);
                        handleUpdate(date, e.target.value);
                    }}
                />
                <button
                    style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                    onClick={() => {
                        const now = new Date();
                        const d = now.toISOString().split('T')[0];
                        const t = now.toTimeString().split(' ')[0].substring(0, 5);
                        setDate(d);
                        setTime(t);
                        localStorage.removeItem('mockTime');
                        onTimeChange(now);
                    }}
                >
                    Reset to Real Time
                </button>
            </div>
        </div>
    );
};

export default TimeWidget;
