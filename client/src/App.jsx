import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import TimeWidget from './components/TimeWidget.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [mockTime, setMockTime] = useState(new Date());

  // Check for stored session
  useEffect(() => {
    const storedUser = localStorage.getItem('menzapp_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('menzapp_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('menzapp_user');
  };

  return (
    <div>
      <TimeWidget onTimeChange={setMockTime} />

      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--color-accent)' }}>
              Dobrodošli, {user.name}!
            </h2>
            <button onClick={handleLogout} style={{ background: '#f5f5f5', color: '#666' }}>
              Odjava
            </button>
          </div>

          {user.role === 'admin' ? (
            <AdminDashboard mockTime={mockTime} />
          ) : (
            <UserDashboard user={user} mockTime={mockTime} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
