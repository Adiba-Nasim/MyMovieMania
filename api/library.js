// ============================================
//  api/library.js  —  MyMovieMania
//  Replaces: backend/api/library.php
//  Watchlist, Watched, Reviews — auth required
// ============================================

const express = require('express');
const db      = require('../config/db');
const { getUserFromToken, optionalAuth } = require('./middleware');

const router = express.Router();

// ══════════ WATCHLIST ════════════════════════

// GET all watchlist items
router.get('/watchlist.get', getUserFromToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
});

// POST add to watchlist
router.post('/watchlist.add', getUserFromToken, async (req, res) => {
    try {
        const { tmdb_id, movie_title, poster_path } = req.body;
        await db.execute(
            'INSERT IGNORE INTO watchlist (user_id, tmdb_id, movie_title, poster_path) VALUES (?, ?, ?, ?)',
            [req.user.id, tmdb_id, movie_title, poster_path || '']
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add to watchlist' });
    }
});

// DELETE remove from watchlist
router.delete('/watchlist.remove', getUserFromToken, async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM watchlist WHERE user_id = ? AND tmdb_id = ?',
            [req.user.id, req.query.tmdb_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
});

// GET check if in watchlist
router.get('/watchlist.check', getUserFromToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id FROM watchlist WHERE user_id = ? AND tmdb_id = ?',
            [req.user.id, req.query.tmdb_id]
        );
        res.json({ in_watchlist: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check watchlist' });
    }
});

// ══════════ WATCHED ══════════════════════════

// GET all watched movies
router.get('/watched.get', getUserFromToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM watched WHERE user_id = ? ORDER BY watched_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch watched movies' });
    }
});

// POST mark as watched
router.post('/watched.add', getUserFromToken, async (req, res) => {
    try {
        const { tmdb_id, movie_title, poster_path } = req.body;

        // Insert into watched
        await db.execute(
            'INSERT IGNORE INTO watched (user_id, tmdb_id, movie_title, poster_path) VALUES (?, ?, ?, ?)',
            [req.user.id, tmdb_id, movie_title, poster_path || '']
        );

        // Also remove from watchlist (auto-clean)
        await db.execute(
            'DELETE FROM watchlist WHERE user_id = ? AND tmdb_id = ?',
            [req.user.id, tmdb_id]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark as watched' });
    }
});

// DELETE remove from watched
router.delete('/watched.remove', getUserFromToken, async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM watched WHERE user_id = ? AND tmdb_id = ?',
            [req.user.id, req.query.tmdb_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove from watched' });
    }
});

// GET check if watched
router.get('/watched.check', getUserFromToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id FROM watched WHERE user_id = ? AND tmdb_id = ?',
            [req.user.id, req.query.tmdb_id]
        );
        res.json({ watched: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check watched status' });
    }
});

// ══════════ REVIEWS ══════════════════════════

// GET my reviews
router.get('/reviews.get', getUserFromToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// GET reviews for a specific movie (public)
router.get('/reviews.getByMovie', optionalAuth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT r.*, u.username, u.avatar_url
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.tmdb_id = ?
             ORDER BY r.created_at DESC`,
            [req.query.tmdb_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch movie reviews' });
    }
});

// POST add/update review
router.post('/reviews.add', getUserFromToken, async (req, res) => {
    try {
        const { tmdb_id, movie_title, poster_path, rating, review_text, liked } = req.body;
        const userId = req.user.id;

        // Get existing rating+liked for this movie (if any previous review exists)
        const [existing] = await db.execute(
            'SELECT rating, liked FROM reviews WHERE user_id = ? AND tmdb_id = ? ORDER BY created_at ASC LIMIT 1',
            [userId, tmdb_id]
        );

        // Use new rating/liked if provided, otherwise keep existing
        const finalRating = (rating !== undefined && rating !== null) ? rating : (existing[0] ? existing[0].rating : null);
        const finalLiked  = (liked  !== undefined && liked  !== null) ? (liked ? 1 : 0) : (existing[0] ? existing[0].liked : 0);

        // Update ALL previous reviews for this movie to reflect new rating+liked
        if (existing.length > 0 && (rating !== undefined || liked !== undefined)) {
            await db.execute(
                'UPDATE reviews SET rating = ?, liked = ? WHERE user_id = ? AND tmdb_id = ?',
                [finalRating, finalLiked, userId, tmdb_id]
            );
        }

        // Insert new review row (always allows multiple review texts)
        const [result] = await db.execute(
            `INSERT INTO reviews (user_id, tmdb_id, movie_title, poster_path, rating, review_text, liked)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, tmdb_id, movie_title, poster_path || '', finalRating, review_text || '', finalLiked]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save review' });
    }
});

// GET user's rating+liked for a specific movie
router.get('/reviews.myrating', getUserFromToken, async (req, res) => {
    try {
        const { tmdb_id } = req.query;
        const [rows] = await db.execute(
            'SELECT rating, liked FROM reviews WHERE user_id = ? AND tmdb_id = ? ORDER BY created_at ASC LIMIT 1',
            [req.user.id, tmdb_id]
        );
        if (rows.length > 0) {
            res.json({ exists: true, rating: rows[0].rating, liked: rows[0].liked });
        } else {
            res.json({ exists: false, rating: 3, liked: 0 });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch rating' });
    }
});

// DELETE review
router.delete('/reviews.delete', getUserFromToken, async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM reviews WHERE id = ? AND user_id = ?',
            [req.query.review_id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

module.exports = router;