import React, { useState, useEffect } from 'react';

const TimeWidget = ({ onTimeChange }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
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
    }, []);

    const handleUpdate = (newDate, newTime) => {
        if (newDate && newTime) {
            const d = new Date(`${newDate}T${newTime}`);
            localStorage.setItem('mockTime', d.toISOString());
            onTimeChange(d);
        }
    };

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
