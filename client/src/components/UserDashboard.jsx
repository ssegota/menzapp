import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const UserDashboard = ({ user, mockTime }) => {
    const [menus, setMenus] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // State for functionality
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState(null);
    // 'select' → user picks a dish, 'legal' → legal warning before commit,
    // 'success' → confirmation with pickup code.
    const [confirmStep, setConfirmStep] = useState('select');
    const [confirmedOrderCode, setConfirmedOrderCode] = useState('');

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);

    // User picks the slot for tomorrow's meal; not time-determined.
    const [selectedSlot, setSelectedSlot] = useState('morning');

    // Settings State
    const [settings, setSettings] = useState({
        orderingStart: 8,
        orderingEnd: 24,
        afternoonEnabled: true,
        morningDeliveryTime: "10:30",
        afternoonDeliveryTime: "16:30"
    });

    const toDateStr = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const currentDateStr = toDateStr(mockTime);

    // Orders are placed for the next workday — Friday → Monday so users
    // aren't stuck with empty weekend menus. The deadline to order or
    // cancel is midnight before that target date.
    const nextWorkday = (from) => {
        const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
        return d;
    };
    const targetDate = nextWorkday(mockTime);
    const targetDateStr = toDateStr(targetDate);

    // Translation helpers
    const getSlotName = (slot) => slot === 'morning' ? 'Jutarnji' : 'Popodnevni';
    const formatDateEU = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    useEffect(() => {
        fetchMenus();
        fetchOrders();
        fetchSettings();
    }, [mockTime]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/settings`);
            const data = await res.json();
            setSettings(data);
        } catch (err) { }
    };

    // If popodne is disabled in settings, force selection back to morning.
    useEffect(() => {
        if (!settings.afternoonEnabled && selectedSlot === 'afternoon') {
            setSelectedSlot('morning');
        }
    }, [settings.afternoonEnabled, selectedSlot]);

    // One daily ordering window — from `orderingStart` to `orderingEnd`
    // (defaults 8 → 24, i.e. midnight). Same window gates both placing
    // and cancelling orders. End=24 represents midnight (next-day 00:00).
    const orderingStart = typeof settings.orderingStart === 'number' ? settings.orderingStart : 8;
    const orderingEnd = typeof settings.orderingEnd === 'number' ? settings.orderingEnd : 24;
    const currentHour = mockTime.getHours();
    const isOrderingActive = currentHour >= orderingStart && currentHour < orderingEnd;
    const endLabel = orderingEnd >= 24 ? 'ponoći (00:00)' : `${String(orderingEnd).padStart(2, '0')}:00`;

    // Mirrors the server check: cancellation needs the order's date still
    // in the future AND the current time to be inside the ordering window.
    const isOrderCancelable = (order) => {
        if (!order || !order.date) return false;
        return currentDateStr < order.date && isOrderingActive;
    };

    const fetchMenus = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/menus`);
            const data = await res.json();
            setMenus(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/orders`);
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error(err);
        }
    };

    // Open confirmation modal
    const initiateOrder = (menu) => {
        setSelectedMenu(menu);
        setConfirmStep('select');
        setConfirmModalOpen(true);
    };
    const closeConfirmModal = () => {
        setConfirmModalOpen(false);
        setConfirmStep('select');
        setConfirmError('');
    };

    const [confirmError, setConfirmError] = useState('');
    const confirmOrder = async () => {
        setLoading(true);
        setConfirmError('');
        try {
            const res = await fetch(`${API_BASE}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    menuId: selectedMenu.id,
                    date: targetDateStr,
                    slot: selectedSlot
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                setMessage('Narudžba zabilježena!');
                setConfirmedOrderCode(data.order.code);
                setConfirmStep('success');
                fetchOrders();
            } else {
                setConfirmError(data.error || `Narudžba nije uspjela (HTTP ${res.status}).`);
            }
        } catch (err) {
            console.error('order POST failed:', err);
            setConfirmError('Greška mreže prilikom naručivanja. Pokušajte ponovo.');
        }
        setLoading(false);
    };

    const openEditModal = (order) => {
        setEditingOrder(order);
        setEditModalOpen(true);
    };

    const handleDeleteOrder = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/orders/${editingOrder.id}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMessage(data.error || 'Otkazivanje nije uspjelo.');
            }
            setEditModalOpen(false);
            setEditingOrder(null);
            fetchOrders();
        } catch (err) {
            console.error(err);
        }
    };

    const availableMenus = menus.filter(m => m.date === targetDateStr && m.slot === selectedSlot);

    // Strike-out: 3 non_collected orders blocks further ordering until an
    // admin releases the user. Mirrors the server gate on POST.
    const NON_COLLECTED_BAN_THRESHOLD = 3;
    const myUnpickedCount = orders.filter(o => o.userId === user.id && o.status === 'non_collected').length;
    const isUserBanned = user.role !== 'admin' && myUnpickedCount >= NON_COLLECTED_BAN_THRESHOLD;

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
                        <h2 className="title" style={{ fontSize: '1.8rem' }}>Naručivanje obroka</h2>

                        {isUserBanned ? (
                            <div style={{
                                padding: '20px',
                                borderRadius: '8px',
                                background: '#ffebee',
                                color: '#c62828',
                                textAlign: 'center',
                                border: '2px solid #c62828'
                            }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: '700' }}>
                                    Naručivanje je blokirano.
                                </p>
                                <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem' }}>
                                    Evidentirano je <strong>{myUnpickedCount}</strong> nepreuzete narudžbe.
                                    Kad broj nepreuzetih dosegne <strong>{NON_COLLECTED_BAN_THRESHOLD}</strong>, naručivanje se automatski blokira.
                                </p>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#7f1d1d' }}>
                                    Za odblokiranje obratite se administratoru menze.
                                </p>
                            </div>
                        ) : !isOrderingActive ? (
                            <div style={{
                                padding: '20px',
                                borderRadius: '8px',
                                background: '#fff3cd',
                                color: '#856404',
                                textAlign: 'center',
                                fontWeight: '600'
                            }}>
                                <p style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>Naručivanje trenutno nije aktivno.</p>
                                <p style={{ margin: 0, fontWeight: 'normal', fontSize: '0.95rem' }}>
                                    Naručivanje je moguće svakodnevno od <strong>{String(orderingStart).padStart(2, '0')}:00</strong> do <strong>{endLabel}</strong>.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    padding: '15px 18px',
                                    borderRadius: '8px',
                                    background: '#e3f2fd',
                                    color: '#1565c0',
                                    marginBottom: '20px',
                                    textAlign: 'left',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.5'
                                }}>
                                    <p style={{ margin: '0 0 8px 0', fontWeight: '700', fontSize: '1.05rem' }}>
                                        Naručujete obrok za {formatDateEU(targetDateStr)}.
                                    </p>
                                    <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                                        <li>Odaberite termin (jutarnji {settings.afternoonEnabled ? 'ili popodnevni' : ''}) i kliknite na željeno jelo.</li>
                                        <li>Naručivanje i otkazivanje moguće je svakodnevno od <strong>{String(orderingStart).padStart(2, '0')}:00 do {endLabel}</strong>; krajnji rok za sutrašnji obrok — danas do <strong>{endLabel}</strong>.</li>
                                        <li>Po potvrdi narudžbe dobit ćete šesteroznamenkasti kod koji pokažete osoblju pri preuzimanju.</li>
                                    </ul>
                                </div>

                                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Termin:</label>
                                    <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '400px' }}>
                                        <button
                                            onClick={() => setSelectedSlot('morning')}
                                            style={{ flex: 1, padding: '10px 20px', background: selectedSlot === 'morning' ? 'var(--color-primary)' : '#eee', color: selectedSlot === 'morning' ? 'var(--color-text)' : '#333' }}
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

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                    {availableMenus.length === 0 ? <p style={{ textAlign: 'center', width: '100%', color: '#888' }}>Nema menija za odabrani termin.</p> : (
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
                            </>
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
                        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
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
                                                <td style={{ padding: '10px' }}>{formatDateEU(order.date)} ({getSlotName(order.slot)})</td>
                                                <td style={{ padding: '10px' }}>
                                                    <span style={{
                                                        background: statusBg,
                                                        color: statusColor,
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.8rem',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModalOpen && selectedMenu && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center', maxWidth: confirmStep === 'success' ? '800px' : (confirmStep === 'legal' ? '640px' : '500px') }}>
                        {confirmStep === 'select' && (
                            <>
                                <h3 style={{ marginTop: 0 }}>Potvrda narudžbe</h3>
                                <p style={{ margin: '0 0 6px 0' }}>Želite li naručiti za <strong>{formatDateEU(targetDateStr)}</strong>, {getSlotName(selectedSlot).toLowerCase()} termin:</p>
                                <div style={{ fontSize: '1.2rem', color: 'var(--color-accent)' }}>
                                    <ReactMarkdown>{selectedMenu.text}</ReactMarkdown>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                                    <button onClick={closeConfirmModal} style={{ background: '#eee', color: '#333' }}>Odustani</button>
                                    <button onClick={() => setConfirmStep('legal')}>Potvrdi</button>
                                </div>
                            </>
                        )}

                        {confirmStep === 'legal' && (
                            <div style={{ textAlign: 'left' }}>
                                <h3 style={{ marginTop: 0, color: 'var(--color-danger)', textAlign: 'center' }}>Pravna obavijest o narudžbi</h3>
                                <p style={{ margin: '0 0 12px 0' }}>
                                    Prije konačne potvrde molimo Vas da pažljivo pročitate sljedeće uvjete.
                                    Klikom na <strong>„Potvrđujem narudžbu"</strong> izjavljujete sljedeće:
                                </p>
                                <ol style={{ paddingLeft: '22px', margin: 0, fontSize: '0.9rem', lineHeight: '1.55' }}>
                                    <li>
                                        Naručujete obrok prema odabranom jelovniku za datum
                                        <strong> {formatDateEU(targetDateStr)}</strong> i <strong>{getSlotName(selectedSlot).toLowerCase()}</strong> termin.
                                        Narudžba je obvezujuća i ima karakter neopozive ponude.
                                    </li>
                                    <li>
                                        Obvezujete se osobno preuzeti obrok u terminu naznačenom za odabrani dan,
                                        u prostorijama menze, predočenjem šesteroznamenkastog koda dodijeljenog po potvrdi narudžbe.
                                    </li>
                                    <li>
                                        Obvezujete se podmiriti puni iznos cijene obroka prema važećem cjeniku menze,
                                        <strong> neovisno o tome jeste li obrok preuzeli ili niste</strong>.
                                        Nedolazak po obrok ne oslobađa od obveze plaćanja.
                                    </li>
                                    <li>
                                        Otkazivanje narudžbe moguće je isključivo tijekom dnevnog prozora naručivanja
                                        (<strong>{String(orderingStart).padStart(2, '0')}:00 – {endLabel}</strong>) i samo dok je datum narudžbe još uvijek u budućnosti.
                                        Nakon isteka tog roka narudžba se smatra konačno prihvaćenom te ju nije moguće stornirati.
                                    </li>
                                    <li>
                                        Šesteroznamenkasti kod predstavlja Vašu identifikaciju pri preuzimanju i <strong>nije prenosiv na treću osobu</strong>.
                                        Zloupotreba koda smatra se kršenjem uvjeta korištenja.
                                    </li>
                                    <li>
                                        U slučaju nepreuzimanja obroka u danom terminu, narudžba se evidentira kao <em>nepreuzeta</em>,
                                        ali ostaje fakturirana i evidentirana u Vašoj povijesti narudžbi.
                                    </li>
                                    <li>
                                        Ova obavijest predstavlja informativni prikaz uvjeta naručivanja i ne zamjenjuje službene uvjete poslovanja menze
                                        ni važeće zakonske propise Republike Hrvatske.
                                    </li>
                                </ol>
                                <p style={{ marginTop: '14px', fontSize: '0.85rem', color: '#555', textAlign: 'center' }}>
                                    Klikom „Potvrđujem narudžbu" potvrđujete da ste pročitali, razumjeli i u cijelosti prihvatili gore navedene uvjete.
                                </p>

                                {confirmError && (
                                    <div style={{ marginTop: '12px', padding: '10px 12px', background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'center' }}>
                                        {confirmError}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                                    <button onClick={() => { setConfirmStep('select'); setConfirmError(''); }} style={{ background: '#eee', color: '#333' }}>Natrag</button>
                                    <button onClick={confirmOrder} disabled={loading} style={{ background: 'var(--color-success)', color: 'white' }}>
                                        {loading ? 'Slanje...' : 'Potvrđujem narudžbu'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {confirmStep === 'success' && (
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '30px', textAlign: 'left', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <img src="/marendapp-2.png" alt="Order Confirmed Logo" style={{ maxWidth: '280px', width: '100%', flex: '1 1 200px' }} />

                                <div style={{ display: 'flex', flexDirection: 'column', flex: '2 1 300px' }}>
                                    <h3 style={{ marginTop: 0, color: 'var(--color-success)', fontSize: '2rem' }}>Narudžba potvrđena!</h3>

                                    <p style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>
                                        Narudžba za <strong>{formatDateEU(targetDateStr)}</strong> je primljena i bit će spremna za preuzimanje oko{' '}
                                        <strong>
                                            {selectedSlot === 'afternoon' ? (settings.afternoonDeliveryTime || '16:30') : (settings.morningDeliveryTime || '10:30')}
                                        </strong>!
                                    </p>

                                    <div style={{ marginTop: '20px', textAlign: 'center', background: '#fffdf5', border: '3px dashed var(--color-primary)', padding: '20px', borderRadius: '12px' }}>
                                        <p style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#555', fontWeight: 'bold' }}>Vaš kod za preuzimanje:</p>
                                        <div style={{ fontSize: '3.5rem', fontWeight: '900', letterSpacing: '6px', color: 'var(--color-accent)' }}>
                                            {confirmedOrderCode}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button onClick={closeConfirmModal} style={{ padding: '12px 40px', fontSize: '1.2rem' }}>
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

                        {!isOrderCancelable(editingOrder) && (
                            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginTop: '15px' }}>
                                Otkazivanje narudžbe više nije moguće — vrijeme za otkazivanje je prošlo.
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button onClick={() => setEditModalOpen(false)} style={{ background: '#eee', color: '#333' }}>Zatvori</button>
                            {isOrderCancelable(editingOrder) && (
                                <button onClick={handleDeleteOrder} style={{ background: 'var(--color-danger)', color: 'white' }}>Obriši narudžbu</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserDashboard;
