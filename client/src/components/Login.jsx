import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { apiFetch, API_BASE } from '../api';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isAnimating, setIsAnimating] = useState(true);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPasswordLogin, setShowPasswordLogin] = useState(false);

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 2000); // 2 seconds delay
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await apiFetch(`${API_BASE}/api/login`, {
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

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsGoogleLoading(true);
        setError('');
        try {
            const response = await apiFetch(`${API_BASE}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential })
            });

            const data = await response.json();
            if (data.success) {
                onLogin(data.user);
            } else {
                setError(data.error || 'Google prijava nije uspjela');
            }
        } catch (err) {
            console.error('Google auth error:', err);
            setError('Greška prilikom Google prijave');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google prijava nije uspjela. Pokušajte ponovo.');
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

                    {/* Google Sign-In Button */}
                    {googleClientId && (
                        <div className="google-login-section">
                            <div className="google-btn-wrapper">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    theme="outline"
                                    size="large"
                                    width="100%"
                                    text="signin_with"
                                    shape="rectangular"
                                    logo_alignment="left"
                                    hosted_domain="unipu.hr"
                                />
                            </div>
                            {isGoogleLoading && (
                                <p style={{ textAlign: 'center', color: 'var(--color-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
                                    Prijava u tijeku...
                                </p>
                            )}

                        </div>
                    )}

                    {error && <div style={{ color: 'var(--color-danger)', fontWeight: 'bold', textAlign: 'center', marginTop: '10px' }}>{error}</div>}

                    {showPasswordLogin ? (
                        <>
                            {googleClientId && (
                                <div className="login-divider">
                                    <span>ili</span>
                                </div>
                            )}
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

                                <button type="submit" style={{ marginTop: '10px' }}>
                                    Prijava
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button
                                type="button"
                                onClick={() => { setShowPasswordLogin(true); setError(''); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-secondary)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    padding: '4px 8px',
                                }}
                            >
                                Prijava administratora
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
