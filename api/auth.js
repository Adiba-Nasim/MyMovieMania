// ============================================
//  api/auth.js  —  MyMovieMania
//  Replaces: backend/api/auth.php
//  Routes: register, login, me, updateProfile
// ============================================

const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../config/db');
const { getUserFromToken } = require('./middleware');

const router = express.Router();

// ── REGISTER ────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Required fields
        if (!username) return res.status(400).json({ error: 'Username is required.', field: 'username' });
        if (!email)    return res.status(400).json({ error: 'Email is required.', field: 'email' });
        if (!password) return res.status(400).json({ error: 'Password is required.', field: 'password' });

        // Username rules
        if (username.trim().length < 3)
            return res.status(400).json({ error: 'Username must be at least 3 characters.', field: 'username' });
        if (username.trim().length > 30)
            return res.status(400).json({ error: 'Username must be under 30 characters.', field: 'username' });
        if (!/^[a-zA-Z0-9_\.]+$/.test(username.trim()))
            return res.status(400).json({ error: 'Username can only contain letters, numbers, _ and .', field: 'username' });

        // Email rules
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return res.status(400).json({ error: 'Please enter a valid email address.', field: 'email' });

        // Password rules
        if (password.length < 6)
            return res.status(400).json({ error: 'Password must be at least 6 characters.', field: 'password' });

        const cleanEmail    = email.toLowerCase().trim();
        const cleanUsername = username.trim();

        // Check email already exists
        const [existingEmail] = await db.execute('SELECT id FROM users WHERE email = ?', [cleanEmail]);
        if (existingEmail.length > 0)
            return res.status(409).json({ error: 'This email is already registered. Try signing in.', field: 'email' });

        // Check username already exists
        const [existingUser] = await db.execute('SELECT id FROM users WHERE username = ?', [cleanUsername]);
        if (existingUser.length > 0)
            return res.status(409).json({ error: 'This username is already taken. Try another.', field: 'username' });

        // Hash password and insert
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [cleanUsername, cleanEmail, hash]
        );

        const userId = result.insertId;
        const token  = Buffer.from(String(userId)).toString('base64');

        res.json({
            success: true,
            token,
            user: { id: userId, username: cleanUsername, email: cleanEmail }
        });

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// ── LOGIN ────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email)    return res.status(400).json({ error: 'Email is required.', field: 'email' });
        if (!password) return res.status(400).json({ error: 'Password is required.', field: 'password' });

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return res.status(400).json({ error: 'Please enter a valid email address.', field: 'email' });

        const cleanEmail = email.toLowerCase().trim();

        const [rows] = await db.execute(
            'SELECT id, username, email, password_hash, avatar_url, bio FROM users WHERE email = ?',
            [cleanEmail]
        );

        if (rows.length === 0)
            return res.status(401).json({ error: 'No account found with this email.', field: 'email' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match)
            return res.status(401).json({ error: 'Incorrect password. Please try again.', field: 'password' });

        delete user.password_hash;
        const token = Buffer.from(String(user.id)).toString('base64');

        res.json({ success: true, token, user });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ── ME (get current user + stats) ───────────
router.get('/me', getUserFromToken, async (req, res) => {
    try {
        const uid = req.user.id;

        const [watchedCount]   = await db.execute('SELECT COUNT(*) AS c FROM watched   WHERE user_id = ?', [uid]);
        const [reviewCount]    = await db.execute('SELECT COUNT(*) AS c FROM reviews   WHERE user_id = ?', [uid]);
        const [watchlistCount] = await db.execute('SELECT COUNT(*) AS c FROM watchlist WHERE user_id = ?', [uid]);

        res.json({
            ...req.user,
            stats: {
                watched  : watchedCount[0].c,
                reviews  : reviewCount[0].c,
                watchlist: watchlistCount[0].c
            }
        });

    } catch (err) {
        console.error('Me error:', err);
        res.status(500).json({ error: 'Could not fetch user.' });
    }
});

// ── UPDATE PROFILE ───────────────────────────
router.post('/updateProfile', getUserFromToken, async (req, res) => {
    try {
        const { username, bio } = req.body;
        const uid = req.user.id;

        if (!username || !username.trim())
            return res.status(400).json({ error: 'Username cannot be empty.', field: 'username' });
        if (username.trim().length < 3)
            return res.status(400).json({ error: 'Username must be at least 3 characters.', field: 'username' });
        if (!/^[a-zA-Z0-9_\.]+$/.test(username.trim()))
            return res.status(400).json({ error: 'Username can only contain letters, numbers, _ and .', field: 'username' });
        if (bio && bio.length > 200)
            return res.status(400).json({ error: 'Bio must be under 200 characters.', field: 'bio' });

        await db.execute(
            'UPDATE users SET username = ?, bio = ? WHERE id = ?',
            [username.trim(), bio || '', uid]
        );

        res.json({ success: true, username: username.trim(), bio: bio || '' });

    } catch (err) {
        console.error('UpdateProfile error:', err);
        res.status(500).json({ error: 'Could not update profile.' });
    }
});

module.exports = router;