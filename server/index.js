require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

app.use(cors());
app.use(bodyParser.json());

// Helper to read data
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Initialize if not exists
            const initialData = { users: [], menus: [], orders: [] };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading data:", err);
        return { users: [], menus: [], orders: [] };
    }
};

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Helper to write data
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing data:", err);
    }
};

// Middleware for mock time
app.use((req, res, next) => {
    const mockTime = req.headers['x-mock-time'];
    if (mockTime) {
        req.currentDate = new Date(mockTime);
    } else {
        req.currentDate = new Date();
    }
    next();
});

// GET all menus
app.get('/api/menus', (req, res) => {
    const data = readData();
    res.json(data.menus);
});

// POST new menu (Admin)
app.post('/api/menus', (req, res) => {
    const { date, slot, items } = req.body;

    if (!date || !slot || !items) {
        return res.status(400).json({ error: "Nedostaju podaci" });
    }

    const data = readData();

    // Validation: 5 menus per day per slot limit
    const existingMenus = data.menus.filter(m => m.date === date && m.slot === slot);
    if (existingMenus.length + items.length > 5) {
        return res.status(400).json({ error: "Maksimalno 5 menija po terminu!" });
    }

    // Add new menus
    const newMenus = items.map(text => ({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        date,
        slot,
        text
    }));

    data.menus.push(...newMenus);
    writeData(data);

    res.json({ success: true, newMenus });
});

// GET orders
app.get('/api/orders', (req, res) => {
    const data = readData();
    res.json(data.orders);
});

// POST order (User selection)
app.post('/api/orders', (req, res) => {
    const { userId, menuId, date, slot } = req.body;

    const data = readData();

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create new order (Allow multiple)
    const newOrder = {
        id: Date.now().toString(),
        userId,
        menuId,
        date,
        slot,
        code,
        status: 'pending',
        timestamp: req.currentDate.toISOString(),
        menuText: data.menus.find(m => m.id === menuId)?.text || 'Unknown'
    };

    data.orders.push(newOrder);

    writeData(data);
    res.json({ success: true, order: newOrder });
});

// PUT update order (Edit)
app.put('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { menuId } = req.body;

    const data = readData();
    const orderIndex = data.orders.findIndex(o => o.id === id);

    if (orderIndex !== -1) {
        data.orders[orderIndex].menuId = menuId;
        writeData(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Narudžba nije pronađena" });
    }
});

// POST move to non-collected (Admin)
app.post('/api/orders/non-collected', (req, res) => {
    console.log("Moving pending orders to non-collected...");
    const data = readData();
    let count = 0;
    data.orders.forEach(o => {
        if (o.status === 'pending') {
            o.status = 'non_collected';
            count++;
        }
    });
    console.log(`Moved ${count} orders.`);
    writeData(data);
    res.json({ success: true, count });
});

// DELETE all non-collected (Admin)
app.delete('/api/orders/non-collected', (req, res) => {
    console.log("Archiving all non-collected orders...");
    const data = readData();
    let count = 0;
    data.orders.forEach(o => {
        if (o.status === 'non_collected') {
            o.status = 'archived';
            count++;
        }
    });
    console.log(`Archived ${count} orders.`);
    writeData(data);
    res.json({ success: true, count });
});


// DELETE order
app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete order: ${id}`);
    const data = readData();
    const newOrders = data.orders.filter(o => o.id !== id);

    if (newOrders.length !== data.orders.length) {
        data.orders = newOrders;
        writeData(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Narudžba nije pronađena" });
    }
});

// POST pickup (Admin)
app.post('/api/orders/:id/pickup', (req, res) => {
    const { id } = req.params;
    const data = readData();
    const order = data.orders.find(o => o.id === id);
    if (order) {
        order.status = 'picked_up';
        writeData(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Narudžba nije pronađena" });
    }
});



// PUT menu (Update)
app.put('/api/menus/:id', (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const data = readData();
    const menu = data.menus.find(m => m.id === id);
    if (menu) {
        menu.text = text;
        writeData(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Meni nije pronađen" });
    }
});

// DELETE menu
app.delete('/api/menus/:id', (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete menu: ${id}`);
    const data = readData();
    const originalLength = data.menus.length;
    const newMenus = data.menus.filter(m => m.id !== id);

    if (newMenus.length !== originalLength) {
        data.menus = newMenus;
        // Also delete associated orders? Or keep them? 
        // Decision: Keep orders, but they now have 'menuText' denormalized so they won't break.
        writeData(data);
        console.log(`Menu ${id} deleted.`);
        res.json({ success: true });
    } else {
        console.log(`Menu ${id} not found.`);
        res.status(404).json({ error: "Meni nije pronađen" });
    }
});

// GET Settings
app.get('/api/settings', (req, res) => {
    const data = readData();
    // Default settings if not present
    const settings = data.settings || {
        morningStart: 8,
        morningEnd: 10,
        afternoonStart: 14,
        afternoonEnd: 16,
        afternoonEnabled: true,
        morningDeliveryTime: "10:30",
        afternoonDeliveryTime: "16:30"
    };
    if (!settings.morningDeliveryTime) settings.morningDeliveryTime = "10:30";
    if (!settings.afternoonDeliveryTime) settings.afternoonDeliveryTime = "16:30";
    res.json(settings);
});

// POST Settings
app.post('/api/settings', (req, res) => {
    const settings = req.body;
    const data = readData();
    data.settings = settings;
    writeData(data);
    res.json({ success: true });
});

// Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: "Token nije poslan" });
    }

    if (!googleClient) {
        return res.status(500).json({ error: "Google OAuth nije konfiguriran na serveru" });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        const data = readData();

        // Look up existing user by email
        let user = data.users.find(u => u.email === email);

        if (!user) {
            // Auto-register new Google user
            const newId = data.users.length > 0
                ? Math.max(...data.users.map(u => typeof u.id === 'number' ? u.id : 0)) + 1
                : 1;

            user = {
                id: newId,
                username: email,
                name: name || email.split('@')[0],
                email: email,
                picture: picture || null,
                role: 'user',
                authProvider: 'google',
                googleId: googleId,
            };

            data.users.push(user);
            writeData(data);
            console.log(`New Google user registered: ${email}`);
        }

        res.json({ success: true, user });
    } catch (err) {
        console.error('Google token verification failed:', err.message);
        res.status(401).json({ error: "Nevažeći Google token" });
    }
});

// Login (Dynamic)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = readData();

    const user = data.users.find(u => u.username === username);

    if (user) {
        // Password check ignored as per instructions "password" for all
        res.json({ success: true, user });
    } else {
        res.status(401).json({ error: "Krivi podaci za prijavu" });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
