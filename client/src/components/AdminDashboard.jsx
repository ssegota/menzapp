import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const AdminDashboard = ({ mockTime }) => {
    const [activeTab, setActiveTab] = useState('menu'); // menu, orders, non-collected, settings
    const [menus, setMenus] = useState([]);
    const [orders, setOrders] = useState([]);
    const [settings, setSettings] = useState({
        morningStart: 8, morningEnd: 10,
        afternoonStart: 14, afternoonEnd: 16,
        afternoonEnabled: true
    });

    // Menu State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState('morning');
    const [menuText, setMenuText] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [editingMenu, setEditingMenu] = useState(null); // Menu object being edited
    const [editMenuText, setEditMenuText] = useState('');

    // Orders State
    const [searchCode, setSearchCode] = useState('');
    const [pickupModalOpen, setPickupModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchMenus();
        fetchOrders();
        fetchSettings();
        setSelectedDate(mockTime);
    }, [mockTime]);

    const fetchMenus = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/menus');
            const data = await res.json();
            setMenus(data);
        } catch (err) { }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/orders');
            const data = await res.json();
            setOrders(data);
        } catch (err) { }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/settings');
            const data = await res.json();
            setSettings(data);
        } catch (err) { }
    };

    // Menu Handlers
    const handleAddMenu = async (e) => {
        e.preventDefault();
        if (!menuText.trim()) return;

        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/menus', {
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
            const res = await fetch(`http://localhost:3000/api/menus/${editingMenu.id}`, {
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
            const res = await fetch(`http://localhost:3000/api/menus/${editingMenu.id}`, { method: 'DELETE' });
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
        if (!window.confirm("Prebaciti sve narudžbe na čekanju u 'Nepreuzeto'?")) return;
        try {
            const res = await fetch('http://localhost:3000/api/orders/non-collected', { method: 'POST' });
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
            const res = await fetch('http://localhost:3000/api/orders/non-collected', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert(`Obrisano ${data.count} narudžbi.`);
                fetchOrders();
            }
        } catch (err) { console.error(err); }
    };

    const exportNonCollected = () => {
        const nonCollected = orders.filter(o => o.status === 'non_collected');
        const csvContent = "data:text/csv;charset=utf-8,"
            + "ID,Korisnik,Jelo,Datum,Termin,Kod\n"
            + nonCollected.map(o => {
                const menu = menus.find(m => m.id === o.menuId);
                const menuText = (menu ? menu.text : o.menuText || 'Unknown').replace(/,/g, '');
                return `${o.id},${o.userId},${menuText},${o.date},${o.slot},${o.code}`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "nepreuzeto.csv");
        document.body.appendChild(link);
        link.click();
    };

    // Settings Handlers
    const handleSaveSettings = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) alert('Postavke spremljene!');
        } catch (err) { console.error(err); }
    };

    // Helpers
    const openPickupModal = (order) => { setSelectedOrder(order); setPickupModalOpen(true); };

    const confirmPickup = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/orders/${selectedOrder.id}/pickup`, { method: 'POST' });
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
    const getFilteredPending = () => searchCode ? pendingOrders.filter(o => o.code && o.code.includes(searchCode)) : pendingOrders;

    return (
        <div className="dashboard-grid">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', gridColumn: '1 / -1' }}>
                {['menu', 'orders', 'non-collected', 'settings'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: activeTab === tab ? 'var(--color-primary)' : '#e0e0e0',
                            color: activeTab === tab ? 'var(--color-text)' : '#555',
                            boxShadow: activeTab === tab ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {tab === 'menu' && 'Meni'}
                        {tab === 'orders' && 'Narudžbe'}
                        {tab === 'non-collected' && 'Nepreuzeto'}
                        {tab === 'settings' && 'Postavke'}
                    </button>
                ))}
            </div>

            {/* MENU TAB */}
            {activeTab === 'menu' && (
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'inherit', gap: '20px' }}>
                    <div>
                        <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Uređivanje Menija</h2>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Datum:</label>
                            <Calendar
                                onChange={setSelectedDate}
                                value={selectedDate}
                                tileDisabled={tileDisabled}
                                className="react-calendar-custom"
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Termin:</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setSelectedSlot('morning')}
                                    style={{ background: selectedSlot === 'morning' ? 'var(--color-primary)' : '#eee' }}
                                >
                                    Jutro
                                </button>
                                {settings.afternoonEnabled && (
                                    <button
                                        onClick={() => setSelectedSlot('afternoon')}
                                        style={{ background: selectedSlot === 'afternoon' ? 'var(--color-secondary)' : '#eee', color: selectedSlot === 'afternoon' ? 'white' : '#333' }}
                                    >
                                        Popodne
                                    </button>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleAddMenu}>
                            <textarea
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

                    <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0 }}>Jela ({selectedDate.toLocaleDateString()})</h3>

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
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h2 className="title" style={{ fontSize: '1.8rem', margin: 0, textAlign: 'left' }}>Narudžbe</h2>
                            <input
                                type="text"
                                placeholder="Traži kod..."
                                value={searchCode}
                                onChange={e => setSearchCode(e.target.value)}
                                style={{ marginTop: '10px', width: '200px' }}
                            />
                        </div>
                        <button
                            onClick={handleMoveToNonCollected}
                            style={{ background: 'var(--color-danger)', color: 'white' }}
                        >
                            Prebaci u Nepreuzeto
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
                                        <h4 style={{ margin: '0 0 5px 0' }}>#{order.userId}</h4>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            {menu ? <ReactMarkdown>{menu.text}</ReactMarkdown> : <ReactMarkdown>{order.menuText || 'Nepoznato jelo (obrisano)'}</ReactMarkdown>}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#888' }}>{order.date} | {order.slot}</span>
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
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="title" style={{ fontSize: '1.8rem' }}>Nepreuzete</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={exportNonCollected} style={{ background: 'var(--color-success)', color: 'white' }}>Export CSV</button>
                            <button onClick={handleDeleteAllNonCollected} style={{ background: 'var(--color-danger)', color: 'white' }}>Obriši Sve</button>
                        </div>
                    </div>

                    {nonCollectedOrders.length === 0 ? <p>Prazno.</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>Korisnik</th>
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
                                            <td style={{ padding: '10px' }}>{order.userId}</td>
                                            <td style={{ padding: '10px' }}>{menu ? <ReactMarkdown>{menu.text}</ReactMarkdown> : <ReactMarkdown>{order.menuText || 'Nepoznato jelo (obrisano)'}</ReactMarkdown>}</td>
                                            <td style={{ padding: '10px' }}>{order.date} ({order.slot})</td>
                                            <td style={{ padding: '10px' }}>{order.code}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 className="title">Postavke</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h3>Jutarnji Termin</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>Početak: <input type="number" value={settings.morningStart} onChange={e => setSettings({ ...settings, morningStart: parseInt(e.target.value) })} /></div>
                                <div>Kraj: <input type="number" value={settings.morningEnd} onChange={e => setSettings({ ...settings, morningEnd: parseInt(e.target.value) })} /></div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Popodnevni Termin</h3>
                                <label>
                                    Enable:
                                    <input type="checkbox" checked={settings.afternoonEnabled} onChange={e => setSettings({ ...settings, afternoonEnabled: e.target.checked })} />
                                </label>
                            </div>
                            {settings.afternoonEnabled && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>Početak: <input type="number" value={settings.afternoonStart} onChange={e => setSettings({ ...settings, afternoonStart: parseInt(e.target.value) })} /></div>
                                    <div>Kraj: <input type="number" value={settings.afternoonEnd} onChange={e => setSettings({ ...settings, afternoonEnd: parseInt(e.target.value) })} /></div>
                                </div>
                            )}
                        </div>

                        <button onClick={handleSaveSettings}>Spremi Postavke</button>
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
                        <textarea
                            value={editMenuText}
                            onChange={e => setEditMenuText(e.target.value)}
                            rows={6}
                            style={{ width: '100%', marginBottom: '20px' }}
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
