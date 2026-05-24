require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const SEED_FILE = path.join(__dirname, 'data.json');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

app.use(cors());
app.use(bodyParser.json());

// Helper to read data
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Seed from bundled data.json (for first boot on a fresh persistent volume),
            // otherwise initialize empty.
            let initialData = { users: [], menus: [], orders: [] };
            if (SEED_FILE !== DATA_FILE && fs.existsSync(SEED_FILE)) {
                initialData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
                console.log(`Seeded ${DATA_FILE} from ${SEED_FILE}`);
            }
            fs.mkdirSync(DATA_DIR, { recursive: true });
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

// Password hashing: scrypt with a per-user random salt. Stored as
// "scrypt$<salt-hex>$<hash-hex>" so future algorithm swaps stay forward-
// compatible. The plaintext password never touches disk or logs.
const SCRYPT_KEYLEN = 64;
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
    return `scrypt$${salt}$${hash}`;
};
const verifyPassword = (password, stored) => {
    if (!stored || typeof stored !== 'string') return false;
    const parts = stored.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
    const [, salt, expectedHex] = parts;
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
};

// On boot: if the admin user has no passwordHash yet and ADMIN_PASSWORD is
// set, hash it and persist. After this runs once on the production volume,
// the env var can be removed — the hash lives in data.json on the volume.
const seedAdminPassword = () => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return;
    const data = readData();
    const admin = data.users.find(u => u.username === 'admin');
    if (admin && !admin.passwordHash) {
        admin.passwordHash = hashPassword(adminPassword);
        writeData(data);
        console.log('Seeded admin passwordHash from ADMIN_PASSWORD env.');
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

// GET orders — joined with user name/email so the admin UI and CSV export
// can show who placed each order without a second round-trip.
app.get('/api/orders', (req, res) => {
    const data = readData();
    const usersById = new Map(data.users.map(u => [u.id, u]));
    const enriched = data.orders.map(o => {
        const u = usersById.get(o.userId);
        return {
            ...o,
            userName: u ? (u.name || u.username) : null,
            userEmail: u ? (u.email || null) : null,
        };
    });
    res.json(enriched);
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
        const { email, name, picture, sub: googleId, hd } = payload;

        if (hd !== 'unipu.hr') {
            return res.status(403).json({ error: "Google prijava je dozvoljena samo s unipu.hr računom - zatražite podatke za login od administratora." });
        }

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

// Login (username/password — admin only; regular users go through Google).
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(401).json({ error: "Krivi podaci za prijavu" });
    }

    const data = readData();
    const user = data.users.find(u => u.username === username);

    if (user && user.passwordHash && verifyPassword(password, user.passwordHash)) {
        const { passwordHash, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    } else {
        res.status(401).json({ error: "Krivi podaci za prijavu" });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

seedAdminPassword();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
