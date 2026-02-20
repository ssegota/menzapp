import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.success) {
                onLogin(data.user);
            } else {
                setError(data.error || 'Neispravni podaci');
            }
        } catch (err) {
            console.error(err);
            setError('Greška na serveru');
        }
    };

    return (
        <div className="login-container">
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h1 className="title">Menzapp</h1>
                <p className="subtitle">Dobrodošli! Prijavite se za nastavak.</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Korisničko ime</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Lozinka</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {error && <div style={{ color: 'var(--color-danger)', fontWeight: 'bold', textAlign: 'center' }}>{error}</div>}

                    <button type="submit" style={{ marginTop: '10px' }}>
                        Prijava
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
