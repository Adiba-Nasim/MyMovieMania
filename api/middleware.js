// ============================================
//  api/middleware.js  —  MyMovieMania
//  Replaces: getUserFromToken() in db.php
//  Decodes token and attaches user to req
// ============================================

const db = require('../config/db');

async function getUserFromToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || '';
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token  = authHeader.replace('Bearer ', '').trim();
        const userId = Buffer.from(token, 'base64').toString('utf8');

        if (!userId || isNaN(userId)) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const [rows] = await db.execute(
            'SELECT id, username, email, avatar_url, bio FROM users WHERE id = ?',
            [parseInt(userId)]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = rows[0];
        next();

    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Optional middleware — doesn't block if no token
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || '';
        if (!authHeader.startsWith('Bearer ')) return next();

        const token  = authHeader.replace('Bearer ', '').trim();
        const userId = Buffer.from(token, 'base64').toString('utf8');

        if (!userId || isNaN(userId)) return next();

        const [rows] = await db.execute(
            'SELECT id, username, email, avatar_url, bio FROM users WHERE id = ?',
            [parseInt(userId)]
        );

        if (rows.length > 0) req.user = rows[0];
        next();

    } catch (err) {
        next();
    }
}

module.exports = { getUserFromToken, optionalAuth };