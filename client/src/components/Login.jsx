import React, { useState, useEffect } from 'react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 500); // 0.5 seconds delay
        return () => clearTimeout(timer);
    }, []);

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
        <div className={`login-page ${isAnimating ? 'animating' : ''}`}>
            <div className="login-logo-side">
                <img src="/marendapp-1.png" alt="MarendApp Logo" className="login-logo" />
            </div>

            <div className="login-form-side">
                <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '20px' }}>
                    <h1 className="title">MarendApp</h1>
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
        </div>
    );
};

export default Login;
