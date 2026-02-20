import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const UserDashboard = ({ user, mockTime }) => {
    const [menus, setMenus] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // State for functionality
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [orderConfirmed, setOrderConfirmed] = useState(false);
    const [confirmedOrderCode, setConfirmedOrderCode] = useState('');

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);

    // Settings State
    const [settings, setSettings] = useState({
        morningStart: 8, morningEnd: 10,
        afternoonStart: 14, afternoonEnd: 16,
        afternoonEnabled: true,
        morningDeliveryTime: "10:30",
        afternoonDeliveryTime: "16:30"
    });

    const currentDateStr = `${mockTime.getFullYear()}-${String(mockTime.getMonth() + 1).padStart(2, '0')}-${String(mockTime.getDate()).padStart(2, '0')}`;
    const currentHour = mockTime.getHours();

    // Translation helpers
    const getSlotName = (slot) => slot === 'morning' ? 'Jutarnji' : 'Popodnevni';
    const getDayName = (dateStr) => new Date(dateStr).toLocaleDateString('hr-HR', { weekday: 'long' });

    useEffect(() => {
        fetchMenus();
        fetchOrders();
        fetchSettings();
    }, [mockTime]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/settings');
            const data = await res.json();
            setSettings(data);
        } catch (err) { }
    };

    let activeSlot = null;
    if (currentHour >= settings.morningStart && currentHour < settings.morningEnd) activeSlot = 'morning';
    if (settings.afternoonEnabled && currentHour >= settings.afternoonStart && currentHour < settings.afternoonEnd) activeSlot = 'afternoon';

    const fetchMenus = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/menus');
            const data = await res.json();
            setMenus(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/orders');
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error(err);
        }
    };

    // Open confirmation modal
    const initiateOrder = (menu) => {
        setSelectedMenu(menu);
        setConfirmModalOpen(true);
    };

    const confirmOrder = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    menuId: selectedMenu.id,
                    date: currentDateStr,
                    slot: activeSlot
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Narudžba zabilježena!');
                setConfirmedOrderCode(data.order.code);
                setOrderConfirmed(true);
                fetchOrders();
            }
        } catch (err) {
            setMessage('Greška prilikom naručivanja.');
        }
        setLoading(false);
    };

    const openEditModal = (order) => {
        setEditingOrder(order);
        setEditModalOpen(true);
    };

    const handleDeleteOrder = async () => {
        try {
            await fetch(`http://localhost:3000/api/orders/${editingOrder.id}`, { method: 'DELETE' });
            setEditModalOpen(false);
            setEditingOrder(null);
            fetchOrders();
        } catch (err) {
            console.error(err);
        }
    };

    const availableMenus = menus.filter(m => m.date === currentDateStr && m.slot === activeSlot);

    // Show all active orders for this user
    const myActiveOrders = orders.filter(o => o.userId === user.id && o.status === 'pending');

    // History Logic
    const historyOrders = orders.filter(o => o.userId === user.id && (o.status === 'picked_up' || o.status === 'non_collected'));

    const [activeTab, setActiveTab] = useState('order'); // order, active_orders, history

    // Centered tab styles
    const tabStyle = (tabName) => ({
        flex: 1,
        background: activeTab === tabName ? 'var(--color-primary)' : '#e0e0e0',
        color: activeTab === tabName ? 'var(--color-text)' : '#555',
        textAlign: 'center',
        padding: '12px',
        fontWeight: 'bold',
        fontSize: '1rem',
        borderRadius: '8px',
        boxShadow: activeTab === tabName ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
        transition: 'all 0.2s ease-in-out'
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', width: '100%', justifyContent: 'center' }}>
                <button onClick={() => setActiveTab('order')} style={tabStyle('order')}>
                    Nova Narudžba
                </button>
                <button onClick={() => setActiveTab('active_orders')} style={tabStyle('active_orders')}>
                    Aktivne Narudžbe
                </button>
                <button onClick={() => setActiveTab('history')} style={tabStyle('history')}>
                    Povijest Narudžbi
                </button>
            </div>

            {activeTab === 'order' && (
                <div style={{ width: '100%' }}>
                    {/* Menu Selection */}
                    <div className="card" style={{ padding: '30px' }}>
                        <h2 className="title" style={{ fontSize: '1.8rem' }}>Današnji Meni</h2>

                        <div style={{
                            padding: '15px',
                            borderRadius: '8px',
                            background: activeSlot ? '#e3f2fd' : '#f5f5f5',
                            color: activeSlot ? '#1565c0' : '#757575',
                            marginBottom: '20px',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}>
                            {activeSlot
                                ? `Trenutno: ${getSlotName(activeSlot)} termin`
                                : `Kuhinja ne prima narudžbe. (Sati: ${currentHour}:00)`
                            }
                            {!activeSlot && (
                                <p style={{ fontWeight: 'normal', fontSize: '0.9rem', margin: '5px 0 0' }}>
                                    Jutro: {settings.morningStart}:00-{settings.morningEnd}:00
                                    {settings.afternoonEnabled && ` & Popodne: ${settings.afternoonStart}:00-${settings.afternoonEnd}:00`}
                                </p>
                            )}
                        </div>

                        {activeSlot && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                {availableMenus.length === 0 ? <p style={{ textAlign: 'center', width: '100%' }}>Nema menija za ovaj termin.</p> : (
                                    availableMenus.map(menu => (
                                        <div
                                            key={menu.id}
                                            className="menu-item"
                                            onClick={() => initiateOrder(menu)}
                                            style={{
                                                padding: '20px',
                                                borderRadius: '12px',
                                                border: '1px solid #ddd',
                                                textAlign: 'center',
                                                background: '#fff'
                                            }}
                                        >
                                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--color-accent)' }}>
                                                <ReactMarkdown>{menu.text}</ReactMarkdown>
                                            </h3>
                                            <span style={{ fontSize: '0.9rem', color: '#888' }}>Klikni za odabir</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'active_orders' && (
                <div style={{ width: '100%' }}>
                    {/* Orders List */}
                    <div className="card" style={{ padding: '30px' }}>
                        <h2 className="title" style={{ fontSize: '1.8rem', textAlign: 'center' }}>Moje Aktivne Narudžbe</h2>
                        {myActiveOrders.length === 0 ? <p style={{ textAlign: 'center', color: '#888', fontSize: '1.1rem' }}>Nema aktivnih narudžbi.</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {myActiveOrders.map(order => {
                                    const menu = menus.find(m => m.id === order.menuId);
                                    return (
                                        <li key={order.id}
                                            onClick={() => openEditModal(order)}
                                            style={{
                                                padding: '15px',
                                                borderBottom: '1px solid #eee',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong style={{ color: 'var(--color-text)' }}>
                                                        {menu ? <ReactMarkdown>{menu.text}</ReactMarkdown> : <ReactMarkdown>{order.menuText || 'Nepoznato jelo'}</ReactMarkdown>}
                                                    </strong>
                                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                                        Kod: <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', background: '#333', padding: '2px 6px', borderRadius: '4px' }}>{order.code}</span>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    background: '#fff3cd',
                                                    color: '#856404',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    Na čekanju
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="card" style={{ width: '100%', padding: '30px' }}>
                    <h2 className="title" style={{ textAlign: 'center' }}>Povijest Narudžbi</h2>
                    {historyOrders.length === 0 ? <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>Nema povijesti narudžbi.</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>Jelo</th>
                                    <th style={{ padding: '10px' }}>Datum</th>
                                    <th style={{ padding: '10px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyOrders.map(order => {
                                    const menu = menus.find(m => m.id === order.menuId);
                                    const statusText = order.status === 'picked_up' ? 'Preuzeto' :
                                        order.status === 'non_collected' ? 'Nepreuzeto' :
                                            'Arhivirano';
                                    const statusColor = order.status === 'picked_up' ? '#2e7d32' :
                                        order.status === 'non_collected' ? '#c62828' :
                                            '#757575'; // Grey for archived
                                    const statusBg = order.status === 'picked_up' ? '#e8f5e9' :
                                        order.status === 'non_collected' ? '#ffebee' :
                                            '#f5f5f5'; // Light grey for archived
                                    return (
                                        <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>
                                                {menu ? <ReactMarkdown>{menu.text}</ReactMarkdown> : <ReactMarkdown>{order.menuText || 'Nepoznato jelo'}</ReactMarkdown>}
                                            </td>
                                            <td style={{ padding: '10px' }}>{order.date} ({getSlotName(order.slot)})</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{
                                                    background: statusBg,
                                                    color: statusColor,
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {statusText}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModalOpen && selectedMenu && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center', maxWidth: orderConfirmed ? '800px' : '500px' }}>
                        {!orderConfirmed ? (
                            <>
                                <h3 style={{ marginTop: 0 }}>Potvrda narudžbe</h3>
                                <p>Želite li naručiti:</p>
                                <div style={{ fontSize: '1.2rem', color: 'var(--color-accent)' }}>
                                    <ReactMarkdown>{selectedMenu.text}</ReactMarkdown>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                                    <button onClick={() => setConfirmModalOpen(false)} style={{ background: '#eee', color: '#333' }}>Odustani</button>
                                    <button onClick={confirmOrder}>{loading ? 'Slanje...' : 'Potvrdi'}</button>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '30px', textAlign: 'left', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <img src="/marendapp-2.png" alt="Order Confirmed Logo" style={{ maxWidth: '280px', width: '100%', flex: '1 1 200px' }} />

                                <div style={{ display: 'flex', flexDirection: 'column', flex: '2 1 300px' }}>
                                    <h3 style={{ marginTop: 0, color: 'var(--color-success)', fontSize: '2rem' }}>Narudžba potvrđena!</h3>

                                    <p style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>
                                        Narudžba je primljena i bit će spremna za preuzimanje oko{' '}
                                        <strong style={{ color: 'var(--color-primary)', background: '#333', padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                                            {activeSlot === 'afternoon' ? (settings.afternoonDeliveryTime || '16:30') : (settings.morningDeliveryTime || '10:30')}
                                        </strong>!
                                    </p>

                                    <div style={{ marginTop: '20px', textAlign: 'center', background: '#fffdf5', border: '3px dashed var(--color-primary)', padding: '20px', borderRadius: '12px' }}>
                                        <p style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#555', fontWeight: 'bold' }}>Vaš kod za preuzimanje:</p>
                                        <div style={{ fontSize: '3.5rem', fontWeight: '900', letterSpacing: '6px', color: 'var(--color-accent)' }}>
                                            {confirmedOrderCode}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button onClick={() => { setConfirmModalOpen(false); setOrderConfirmed(false); }} style={{ padding: '12px 40px', fontSize: '1.2rem' }}>
                                            Zatvori
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit/Remove Modal */}
            {editModalOpen && editingOrder && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ marginTop: 0 }}>Detalji narudžbe</h3>
                        <div>
                            <strong>Jelo:</strong>
                            {menus.find(m => m.id === editingOrder.menuId) ?
                                <ReactMarkdown>{menus.find(m => m.id === editingOrder.menuId).text}</ReactMarkdown>
                                : <ReactMarkdown>{editingOrder.menuText || 'Nepoznato jelo (obrisano)'}</ReactMarkdown>}
                        </div>
                        <p><strong>Kod za preuzimanje:</strong></p>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            margin: '20px 0',
                            letterSpacing: '5px',
                            color: 'var(--color-primary)',
                            background: '#333',
                            padding: '10px',
                            borderRadius: '8px'
                        }}>
                            {editingOrder.code}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button onClick={() => setEditModalOpen(false)} style={{ background: '#eee', color: '#333' }}>Zatvori</button>
                            <button onClick={handleDeleteOrder} style={{ background: 'var(--color-danger)', color: 'white' }}>Obriši narudžbu</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserDashboard;
