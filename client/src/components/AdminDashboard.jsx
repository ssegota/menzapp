import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { apiFetch, API_BASE } from '../api';

// Tiny Markdown toolbar — wraps the current selection (bold/italic) or
// prepends a line-prefix (heading, list). Stays inside what ReactMarkdown
// can already render, so no new dependency or renderer config.
const MarkdownToolbar = ({ textareaRef, value, setValue }) => {
    const wrap = (token, placeholder = 'tekst') => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = value.substring(start, end) || placeholder;
        const next = value.substring(0, start) + token + selected + token + value.substring(end);
        setValue(next);
        requestAnimationFrame(() => {
            ta.focus();
            const caretStart = start + token.length;
            ta.setSelectionRange(caretStart, caretStart + selected.length);
        });
    };
    const linePrefix = (prefix) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const caret = ta.selectionStart;
        const lineStart = value.lastIndexOf('\n', caret - 1) + 1;
        const tail = value.substring(lineStart);
        const stripped = tail.replace(/^(#{1,6} |- |\* |\d+\. )/, '');
        const diff = tail.length - stripped.length;
        const next = value.substring(0, lineStart) + prefix + stripped;
        setValue(next);
        requestAnimationFrame(() => {
            ta.focus();
            const pos = caret + prefix.length - diff;
            ta.setSelectionRange(pos, pos);
        });
    };

    const btn = { padding: '4px 10px', fontSize: '0.85rem', background: '#eee', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', minWidth: 'auto' };
    const sep = { width: '1px', background: '#ccc', margin: '0 4px' };

    return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px', alignItems: 'center' }}>
            <button type="button" style={{ ...btn, fontWeight: 'bold' }} title="Podebljano (**)" onClick={() => wrap('**')}>B</button>
            <button type="button" style={{ ...btn, fontStyle: 'italic' }} title="Kurziv (*)" onClick={() => wrap('*')}>I</button>
            <span style={sep} />
            <button type="button" style={btn} title="Veliki naslov (#)" onClick={() => linePrefix('# ')}>H1</button>
            <button type="button" style={btn} title="Srednji naslov (##)" onClick={() => linePrefix('## ')}>H2</button>
            <button type="button" style={btn} title="Mali naslov (###)" onClick={() => linePrefix('### ')}>H3</button>
            <span style={sep} />
            <button type="button" style={btn} title="Lista (-)" onClick={() => linePrefix('- ')}>• Lista</button>
            <button type="button" style={btn} title="Numerirana lista (1.)" onClick={() => linePrefix('1. ')}>1. Lista</button>
        </div>
    );
};

const AdminDashboard = ({ mockTime }) => {
    const [activeTab, setActiveTab] = useState('menu'); // menu, orders, non-collected, users, settings
    const [menus, setMenus] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [settings, setSettings] = useState({
        orderingStart: 8,
        orderingEnd: 24,
        afternoonEnabled: true,
        morningDeliveryTime: "10:30",
        afternoonDeliveryTime: "16:30"
    });

    // Menu State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState('morning');
    const [menuText, setMenuText] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [editingMenu, setEditingMenu] = useState(null); // Menu object being edited
    const [editMenuText, setEditMenuText] = useState('');
    const menuTextareaRef = useRef(null);
    const editMenuTextareaRef = useRef(null);

    // Orders State
    const [searchCode, setSearchCode] = useState('');
    const [orderSlotFilter, setOrderSlotFilter] = useState('all'); // all, morning, afternoon
    const [pickupModalOpen, setPickupModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Developer settings — gated by a hardcoded password so a normal admin
    // doesn't accidentally toggle internal flags. NOT real security; the
    // backend setting can still be changed by anyone who knows the API.
    // The gate exists to keep the controls out of casual reach.
    const DEV_PASSWORD = 'menza-dev-1';
    const [devUnlocked, setDevUnlocked] = useState(false);
    const [devPasswordInput, setDevPasswordInput] = useState('');
    const [devPasswordError, setDevPasswordError] = useState('');

    useEffect(() => {
        fetchMenus();
        fetchOrders();
        fetchSettings();
        fetchUsers();
        setSelectedDate(mockTime);
    }, [mockTime]);

    const fetchMenus = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/api/menus`);
            const data = await res.json();
            setMenus(data);
        } catch (err) { }
    };

    const fetchOrders = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/api/orders`);
            const data = await res.json();
            setOrders(data);
        } catch (err) { }
    };

    const fetchSettings = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/api/settings`);
            const data = await res.json();
            setSettings(data);
        } catch (err) { }
    };

    const fetchUsers = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/api/users`);
            const data = await res.json();
            setUsers(data);
        } catch (err) { }
    };

    const handleReleaseUser = async (u) => {
        const label = u.name || u.username || u.email || `#${u.id}`;
        if (!window.confirm(`Otpustiti korisnika ${label}? Sve njihove nepreuzete narudžbe (${u.unpickedCount}) će biti arhivirane i blokada uklonjena.`)) return;
        try {
            const res = await apiFetch(`${API_BASE}/api/users/${u.id}/release`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`Otpušteno: arhivirano ${data.count} narudžbi.`);
                fetchUsers();
                fetchOrders();
            } else {
                alert(data.error || 'Otpuštanje nije uspjelo.');
            }
        } catch (err) {
            console.error(err);
            alert('Greška mreže pri otpuštanju.');
        }
    };

    const formatDateEU = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    // Menu Handlers
    const handleAddMenu = async (e) => {
        e.preventDefault();
        if (!menuText.trim()) return;

        setLoading(true);
        try {
            const res = await apiFetch(`${API_BASE}/api/menus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
                    slot: selectedSlot,
                    items: [menuText]
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Meni dodan!');
                setMenuText('');
                fetchMenus();
            } else {
                setMessage('Greška: ' + data.error);
            }
        } catch (err) {
            setMessage('Neuspješno dodavanje');
        }
        setLoading(false);
    };

    const handleUpdateMenu = async () => {
        if (!editingMenu) return;
        try {
            const res = await apiFetch(`${API_BASE}/api/menus/${editingMenu.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: editMenuText })
            });
            if (res.ok) {
                setEditingMenu(null);
                fetchMenus();
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteMenu = async () => {
        if (!editingMenu) return;
        if (!window.confirm("Sigurno obrisati ovo jelo?")) return;
        try {
            const res = await apiFetch(`${API_BASE}/api/menus/${editingMenu.id}`, { method: 'DELETE' });
            if (res.ok) {
                setMessage('Meni obrisan.');
                setEditingMenu(null);
                fetchMenus();
            } else {
                const data = await res.json();
                alert('Greška pri brisanju: ' + (data.error || 'Nepoznata greška'));
            }
        } catch (err) {
            console.error(err);
            alert('Greška mreže pri brisanju');
        }
    };

    // Orders Handlers
    const handleMoveToNonCollected = async () => {
        const total = pendingOrders.length;
        const past = pastOrTodayPending;
        const future = futurePending;
        const msg = future > 0
            ? `Prebaciti ${total} narudžbi na čekanju u Nepreuzeto?\n\n• ${past} s datumom ≤ ${todayStr}\n• ${future} pred-narudžbe za buduće dane (bit će također arhivirane).`
            : `Prebaciti ${total} narudžbi na čekanju u Nepreuzeto?`;
        if (!window.confirm(msg)) return;
        try {
            const res = await apiFetch(`${API_BASE}/api/orders/non-collected`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`Prebačeno ${data.count} narudžbi.`);
                fetchOrders();
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteAllNonCollected = async () => {
        if (!window.confirm("Sigurno obrisati SVE nepreuzete narudžbe?")) return;
        try {
            const res = await apiFetch(`${API_BASE}/api/orders/non-collected`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert(`Obrisano ${data.count} narudžbi.`);
                fetchOrders();
            }
        } catch (err) { console.error(err); }
    };

    const exportNonCollected = () => {
        const nonCollected = orders.filter(o => o.status === 'non_collected');
        // RFC 4180: wrap each field in quotes, double-up any embedded quotes.
        // Handles commas, newlines (from multi-line markdown menus), and
        // quotes inside fields without corrupting subsequent columns.
        const csvField = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = ['ID', 'Ime', 'Email', 'Jelo', 'Datum', 'Termin', 'Kod'];
        const rows = nonCollected.map(o => {
            const menu = menus.find(m => m.id === o.menuId);
            const menuText = menu ? menu.text : (o.menuText || 'Unknown');
            return [
                o.id,
                o.userName || `#${o.userId}`,
                o.userEmail || '',
                menuText,
                formatDateEU(o.date),
                o.slot,
                o.code,
            ];
        });
        const csv = [header, ...rows]
            .map(row => row.map(csvField).join(';'))
            .join('\r\n');

        // Prepend UTF-8 BOM so Excel renders č/š/ž correctly on Windows.
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'nepreuzeto.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Settings Handlers
    const handleSaveSettings = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) alert('Postavke spremljene!');
        } catch (err) { console.error(err); }
    };

    // Dev settings save: same POST, but reloads the page so TimeWidget
    // (which reads settings only on mount) actually picks up the toggle.
    const handleSaveDevSettings = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                alert('Dev postavke spremljene. Stranica će se ponovno učitati.');
                window.location.reload();
            }
        } catch (err) { console.error(err); }
    };

    // Helpers
    const openPickupModal = (order) => { setSelectedOrder(order); setPickupModalOpen(true); };

    const confirmPickup = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/api/orders/${selectedOrder.id}/pickup`, { method: 'POST' });
            if (res.ok) { fetchOrders(); setPickupModalOpen(false); setSelectedOrder(null); }
        } catch (err) { console.error(err); }
    };

    const tileDisabled = ({ date, view }) => {
        // Disable weekends
        if (view === 'month') {
            return date.getDay() === 0 || date.getDay() === 6;
        }
    };

    const currentDayMenus = menus.filter(m => m.date === `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` && m.slot === selectedSlot);

    // Filter logic
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const nonCollectedOrders = orders.filter(o => o.status === 'non_collected');
    const todayStr = `${mockTime.getFullYear()}-${String(mockTime.getMonth() + 1).padStart(2, '0')}-${String(mockTime.getDate()).padStart(2, '0')}`;
    // For the "Prebaci u Nepreuzeto" confirmation: split today-or-earlier
    // vs future so the admin sees if they're about to sweep next-workday
    // pre-orders alongside actual no-shows. The server moves every pending
    // order regardless — this is just the up-front warning.
    const pastOrTodayPending = pendingOrders.filter(o => o.date <= todayStr).length;
    const futurePending = pendingOrders.length - pastOrTodayPending;
    const getFilteredPending = () => {
        let filtered = pendingOrders;
        if (orderSlotFilter !== 'all') {
            filtered = filtered.filter(o => o.slot === orderSlotFilter);
        }
        if (searchCode) {
            filtered = filtered.filter(o => o.code && o.code.includes(searchCode));
        }
        return filtered;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                {['menu', 'orders', 'non-collected', 'users', 'settings'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: '1 1 auto',
                            minWidth: '120px',
                            background: activeTab === tab ? 'var(--color-primary)' : '#e0e0e0',
                            color: activeTab === tab ? 'var(--color-text)' : '#555',
                            boxShadow: activeTab === tab ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                            textAlign: 'center',
                            padding: '12px',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        {tab === 'menu' && 'Meni'}
                        {tab === 'orders' && 'Narudžbe'}
                        {tab === 'non-collected' && 'Nepreuzeto'}
                        {tab === 'users' && 'Korisnici'}
                        {tab === 'settings' && 'Postavke'}
                    </button>
                ))}
            </div>

            {/* MENU TAB */}
            {activeTab === 'menu' && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'row', gap: '20px', maxWidth: '1000px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div className="card" style={{ padding: '30px', flex: '1 1 400px' }}>
                        <h2 className="title" style={{ fontSize: '1.8rem', textAlign: 'center' }}>Uređivanje Menija</h2>

                        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Datum:</label>
                            <Calendar
                                onChange={setSelectedDate}
                                value={selectedDate}
                                tileDisabled={tileDisabled}
                                className="react-calendar-custom"
                            />
                        </div>

                        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Termin:</label>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    onClick={() => setSelectedSlot('morning')}
                                    style={{ flex: 1, padding: '10px 20px', background: selectedSlot === 'morning' ? 'var(--color-primary)' : '#eee' }}
                                >
                                    Jutro
                                </button>
                                {settings.afternoonEnabled && (
                                    <button
                                        onClick={() => setSelectedSlot('afternoon')}
                                        style={{ flex: 1, padding: '10px 20px', background: selectedSlot === 'afternoon' ? 'var(--color-secondary)' : '#eee', color: selectedSlot === 'afternoon' ? 'white' : '#333' }}
                                    >
                                        Popodne
                                    </button>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleAddMenu}>
                            <MarkdownToolbar textareaRef={menuTextareaRef} value={menuText} setValue={setMenuText} />
                            <textarea
                                ref={menuTextareaRef}
                                value={menuText}
                                onChange={e => setMenuText(e.target.value)}
                                placeholder="Unesite meni (Markdown)..."
                                rows={6}
                                style={{ width: '100%', marginBottom: '10px', fontFamily: 'monospace' }}
                            />
                            <button type="submit" disabled={loading || currentDayMenus.length >= 5} style={{ width: '100%' }}>
                                {loading ? 'Spremanje...' : 'Dodaj Jelo'}
                            </button>
                        </form>
                    </div>

                    <div className="card" style={{ padding: '30px', textAlign: 'center', flex: '1 1 400px' }}>
                        <h3 style={{ marginTop: 0, fontSize: '1.5rem', color: 'var(--color-accent)' }}>
                            Jela ({formatDateEU(`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`)})
                        </h3>

                        {currentDayMenus.length === 0 ? <p style={{ color: '#888' }}>Nema jela.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {currentDayMenus.map(m => (
                                    <div key={m.id}
                                        onClick={() => { setEditingMenu(m); setEditMenuText(m.text); }}
                                        style={{
                                            background: 'white',
                                            padding: '15px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <ReactMarkdown>{m.text}</ReactMarkdown>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
                <div className="card" style={{ width: '100%', padding: '30px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
                        <h2 className="title" style={{ fontSize: '1.8rem', margin: 0 }}>Sve Narudžbe</h2>

                        <select
                            value={orderSlotFilter}
                            onChange={e => setOrderSlotFilter(e.target.value)}
                            style={{ width: '100%', maxWidth: '300px', textAlign: 'center', padding: '10px', borderRadius: '8px' }}
                        >
                            <option value="all">Svi termini</option>
                            <option value="morning">Jutro</option>
                            <option value="afternoon">Popodne</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Traži kod..."
                            value={searchCode}
                            onChange={e => setSearchCode(e.target.value)}
                            style={{ width: '100%', maxWidth: '300px', textAlign: 'center' }}
                        />
                        <button
                            onClick={handleMoveToNonCollected}
                            disabled={pendingOrders.length === 0}
                            title={pendingOrders.length === 0
                                ? 'Nema narudžbi na čekanju.'
                                : `Prebacuje svih ${pendingOrders.length} narudžbi na čekanju u nepreuzete.`}
                            style={{ background: pendingOrders.length === 0 ? '#bbb' : 'var(--color-danger)', color: 'white', width: '100%', maxWidth: '300px', cursor: pendingOrders.length === 0 ? 'not-allowed' : 'pointer' }}
                        >
                            Prebaci u Nepreuzeto ({pendingOrders.length})
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                        {getFilteredPending().length === 0 ? <p style={{ color: '#888' }}>Nema narudžbi.</p> :
                            getFilteredPending().map(order => {
                                const menu = menus.find(m => m.id === order.menuId);
                                return (
                                    <div key={order.id}
                                        onClick={() => openPickupModal(order)}
                                        style={{
                                            padding: '15px',
                                            borderRadius: '8px',
                                            border: '1px solid #eee',
                                            background: '#fff',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <h4 style={{ margin: '0 0 2px 0' }}>{order.userName || `#${order.userId}`}</h4>
                                        {order.userEmail && (
                                            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '5px' }}>{order.userEmail}</div>
                                        )}
                                        <div style={{ fontSize: '0.9rem' }}>
                                            {menu ? <ReactMarkdown>{menu.text}</ReactMarkdown> : <ReactMarkdown>{order.menuText || 'Nepoznato jelo (obrisano)'}</ReactMarkdown>}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#888' }}>{formatDateEU(order.date)} | {order.slot}</span>
                                            <span style={{ fontWeight: 'bold', background: '#333', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px' }}>
                                                {order.code}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            )}

            {/* NON-COLLECTED TAB */}
            {activeTab === 'non-collected' && (
                <div className="card" style={{ width: '100%', padding: '30px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                        <h2 className="title" style={{ fontSize: '1.8rem', margin: 0 }}>Nepreuzete Narudžbe</h2>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={exportNonCollected} style={{ background: 'var(--color-success)', color: 'white', minWidth: '150px' }}>Export CSV</button>
                            <button onClick={handleDeleteAllNonCollected} style={{ background: 'var(--color-danger)', color: 'white', minWidth: '150px' }}>Obriši Sve</button>
                        </div>
                    </div>

                    {nonCollectedOrders.length === 0 ? <p style={{ textAlign: 'center' }}>Prazno.</p> : (
                        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', minWidth: '500px' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                        <th style={{ padding: '10px' }}>Ime</th>
                                        <th style={{ padding: '10px' }}>Email</th>
                                        <th style={{ padding: '10px' }}>Jelo</th>
                                        <th style={{ padding: '10px' }}>Datum</th>
                                        <th style={{ padding: '10px' }}>Kod</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nonCollectedOrders.map(order => {
                                        const menu = menus.find(m => m.id === order.menuId);
                                        return (
                                            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '10px' }}>{order.userName || `#${order.userId}`}</td>
                                                <td style={{ padding: '10px', color: '#666' }}>{order.userEmail || ''}</td>
                                                <td style={{ padding: '10px' }}>{menu ? <ReactMarkdown>{menu.text}</ReactMarkdown> : <ReactMarkdown>{order.menuText || 'Nepoznato jelo (obrisano)'}</ReactMarkdown>}</td>
                                                <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{formatDateEU(order.date)} ({order.slot})</td>
                                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{order.code}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="card" style={{ width: '100%', padding: '30px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <h2 className="title" style={{ fontSize: '1.8rem', margin: 0 }}>Korisnici</h2>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>
                            Korisnici s 3+ nepreuzete narudžbe su blokirani. Klikom na <strong>Otpusti</strong> arhiviraju se njihove nepreuzete narudžbe i blokada se uklanja.
                        </p>
                        <input
                            type="text"
                            placeholder="Traži po imenu ili emailu..."
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '10px', borderRadius: '8px' }}
                        />
                    </div>

                    {(() => {
                        const q = userSearch.trim().toLowerCase();
                        const filtered = users.filter(u => {
                            if (!q) return true;
                            return (u.name || '').toLowerCase().includes(q)
                                || (u.username || '').toLowerCase().includes(q)
                                || (u.email || '').toLowerCase().includes(q);
                        });
                        if (filtered.length === 0) {
                            return <p style={{ textAlign: 'center', color: '#888' }}>Nema korisnika koji odgovaraju pretrazi.</p>;
                        }
                        return (
                            <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                            <th style={{ padding: '10px' }}>Ime</th>
                                            <th style={{ padding: '10px' }}>Email</th>
                                            <th style={{ padding: '10px', textAlign: 'center' }}>Nepreuzete</th>
                                            <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                                            <th style={{ padding: '10px', textAlign: 'center' }}>Akcija</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(u => (
                                            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '10px' }}>{u.name || u.username || `#${u.id}`}</td>
                                                <td style={{ padding: '10px', color: '#666' }}>{u.email || ''}</td>
                                                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: u.unpickedCount > 0 ? (u.isBanned ? '#c62828' : '#ef6c00') : '#2e7d32' }}>
                                                    {u.unpickedCount}
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                    {u.role === 'admin' ? (
                                                        <span style={{ background: '#e0e0e0', color: '#555', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>Admin</span>
                                                    ) : u.isBanned ? (
                                                        <span style={{ background: '#ffebee', color: '#c62828', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>Blokiran</span>
                                                    ) : (
                                                        <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>OK</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                    {u.role !== 'admin' && u.unpickedCount > 0 ? (
                                                        <button
                                                            onClick={() => handleReleaseUser(u)}
                                                            style={{ background: 'var(--color-success)', color: 'white', padding: '6px 14px', fontSize: '0.85rem' }}
                                                        >
                                                            Otpusti
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: '#bbb' }}>—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 className="title">Postavke</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h3 style={{ marginBottom: '10px', marginTop: 0 }}>Vrijeme naručivanja</h3>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#666' }}>
                                Jedinstveni dnevni prozor unutar kojeg korisnici mogu naručivati i otkazivati za idući radni dan. Sati u 24-satnom formatu; <strong>24 = ponoć (00:00)</strong>.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Početak (sat):</label>
                                    <input type="number" min="0" max="23" value={settings.orderingStart ?? 8} onChange={e => setSettings({ ...settings, orderingStart: parseInt(e.target.value) || 0 })} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Kraj (sat):</label>
                                    <input type="number" min="1" max="24" value={settings.orderingEnd ?? 24} onChange={e => setSettings({ ...settings, orderingEnd: parseInt(e.target.value) || 24 })} style={{ width: '100%' }} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0 }}>Popodnevni termin (slot)</h3>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    Omogući:
                                    <input type="checkbox" checked={settings.afternoonEnabled} onChange={e => setSettings({ ...settings, afternoonEnabled: e.target.checked })} style={{ width: 'auto' }} />
                                </label>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                                Određuje smije li korisnik birati popodnevni termin pri naručivanju. Vrijeme isporuke postavlja se ispod.
                            </p>
                        </div>

                        <div>
                            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Vrijeme Isporuke</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', textAlign: 'center' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Jutro (HH:MM):</label>
                                    <input
                                        type="time"
                                        value={settings.morningDeliveryTime || "10:30"}
                                        onChange={e => setSettings({ ...settings, morningDeliveryTime: e.target.value })}
                                        style={{ width: '100%', textAlign: 'center' }}
                                    />
                                </div>
                                {settings.afternoonEnabled && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>Popodne (HH:MM):</label>
                                        <input
                                            type="time"
                                            value={settings.afternoonDeliveryTime || "16:30"}
                                            onChange={e => setSettings({ ...settings, afternoonDeliveryTime: e.target.value })}
                                            style={{ width: '100%', textAlign: 'center' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button onClick={handleSaveSettings} style={{ width: '100%', marginTop: '10px' }}>Spremi Postavke</button>

                        {/* Developer settings — locked behind a password to
                            keep casual admin clicks away from dev flags. */}
                        <div style={{ marginTop: '30px', borderTop: '2px dashed #ccc', paddingTop: '20px' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Developer settings</h3>
                            {!devUnlocked ? (
                                <div>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#777' }}>
                                        Ova sekcija sadrži interne razvojne opcije. Unesite lozinku za pristup.
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <input
                                            type="password"
                                            placeholder="Dev lozinka"
                                            value={devPasswordInput}
                                            onChange={e => { setDevPasswordInput(e.target.value); setDevPasswordError(''); }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    if (devPasswordInput === DEV_PASSWORD) { setDevUnlocked(true); setDevPasswordError(''); }
                                                    else setDevPasswordError('Neispravna lozinka.');
                                                }
                                            }}
                                            style={{ flex: 1, minWidth: '180px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (devPasswordInput === DEV_PASSWORD) { setDevUnlocked(true); setDevPasswordError(''); }
                                                else setDevPasswordError('Neispravna lozinka.');
                                            }}
                                            style={{ background: '#555', color: 'white' }}
                                        >
                                            Otključaj
                                        </button>
                                    </div>
                                    {devPasswordError && (
                                        <p style={{ margin: '8px 0 0 0', color: 'var(--color-danger)', fontSize: '0.85rem' }}>{devPasswordError}</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#fafafa', borderRadius: '6px' }}>
                                        <input
                                            type="checkbox"
                                            checked={settings.timeTravelEnabled !== false}
                                            onChange={e => setSettings({ ...settings, timeTravelEnabled: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        <span>
                                            <strong>Time Travel widget</strong>
                                            <span style={{ display: 'block', fontSize: '0.8rem', color: '#777' }}>
                                                Prikazuje plivajući widget za promjenu trenutnog vremena u aplikaciji (razvojni alat).
                                            </span>
                                        </span>
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={handleSaveDevSettings}
                                            style={{ background: 'var(--color-success)', color: 'white', fontSize: '0.9rem', padding: '8px 16px' }}
                                        >
                                            Spremi Dev postavke
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setDevUnlocked(false); setDevPasswordInput(''); }}
                                            style={{ background: '#eee', color: '#333', fontSize: '0.85rem', padding: '6px 12px' }}
                                        >
                                            Zaključaj
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pickup Modal */}
            {pickupModalOpen && selectedOrder && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center' }}>
                        <h3 style={{ marginTop: 0 }}>Izdavanje Narudžbe</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '20px 0', color: 'var(--color-primary)', background: '#333', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
                            {selectedOrder.code}
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            {menus.find(m => m.id === selectedOrder.menuId) ?
                                <ReactMarkdown>{menus.find(m => m.id === selectedOrder.menuId).text}</ReactMarkdown>
                                : <ReactMarkdown>{selectedOrder.menuText || 'Nepoznato jelo'}</ReactMarkdown>
                            }
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => setPickupModalOpen(false)} style={{ background: '#eee', color: '#333' }}>Zatvori</button>
                            <button onClick={confirmPickup} style={{ background: 'var(--color-success)', color: 'white' }}>Potvrdi</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Menu Modal */}
            {editingMenu && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Uredi Meni</h3>
                        <MarkdownToolbar textareaRef={editMenuTextareaRef} value={editMenuText} setValue={setEditMenuText} />
                        <textarea
                            ref={editMenuTextareaRef}
                            value={editMenuText}
                            onChange={e => setEditMenuText(e.target.value)}
                            rows={6}
                            style={{ width: '100%', marginBottom: '20px', fontFamily: 'monospace' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={handleDeleteMenu} style={{ background: 'var(--color-danger)', color: 'white', marginRight: 'auto' }}>Obriši</button>
                            <button onClick={() => setEditingMenu(null)} style={{ background: '#eee', color: '#333' }}>Otkaži</button>
                            <button onClick={handleUpdateMenu}>Spremi</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;
