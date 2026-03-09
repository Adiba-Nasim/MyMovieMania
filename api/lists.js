// ============================================
//  api/lists.js  —  MyMovieMania
//  Replaces: backend/api/lists.php
//  Custom film lists — auth required
// ============================================

const express = require('express');
const db      = require('../config/db');
const { getUserFromToken } = require('./middleware');

const router = express.Router();

// GET all lists for current user
router.get('/get', getUserFromToken, async (req, res) => {
    try {
        const uid = req.query.user_id ? parseInt(req.query.user_id) : req.user.id;
        const [lists] = await db.execute(
            'SELECT * FROM lists WHERE user_id = ? ORDER BY created_at DESC',
            [uid]
        );

        // Attach item count to each list
        for (const list of lists) {
            const [count] = await db.execute(
                'SELECT COUNT(*) AS c FROM list_items WHERE list_id = ?',
                [list.id]
            );
            list.item_count = count[0].c;
        }

        res.json(lists);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch lists' });
    }
});

// GET single list with all items
router.get('/getOne', getUserFromToken, async (req, res) => {
    try {
        const { list_id } = req.query;
        const [lists] = await db.execute(
            `SELECT l.*, u.username
             FROM lists l
             JOIN users u ON l.user_id = u.id
             WHERE l.id = ?`,
            [list_id]
        );

        if (lists.length === 0)
            return res.status(404).json({ error: 'List not found' });

        const list = lists[0];
        const [items] = await db.execute(
            'SELECT * FROM list_items WHERE list_id = ? ORDER BY position ASC',
            [list_id]
        );

        list.items = items;
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch list' });
    }
});

// POST create new list
router.post('/create', getUserFromToken, async (req, res) => {
    try {
        const { title, description, is_public } = req.body;
        if (!title || !title.trim())
            return res.status(400).json({ error: 'List title is required' });

        const [result] = await db.execute(
            'INSERT INTO lists (user_id, title, description, is_public) VALUES (?, ?, ?, ?)',
            [req.user.id, title.trim(), description || '', is_public ? 1 : 0]
        );

        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create list' });
    }
});

// DELETE a list
router.delete('/delete', getUserFromToken, async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM lists WHERE id = ? AND user_id = ?',
            [req.query.list_id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete list' });
    }
});

// POST add movie to list
router.post('/addItem', getUserFromToken, async (req, res) => {
    try {
        const { list_id, tmdb_id, movie_title, poster_path, position } = req.body;
        await db.execute(
            'INSERT IGNORE INTO list_items (list_id, tmdb_id, movie_title, poster_path, position) VALUES (?, ?, ?, ?, ?)',
            [list_id, tmdb_id, movie_title, poster_path || '', position || 0]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add item to list' });
    }
});

// DELETE remove movie from list
router.delete('/removeItem', getUserFromToken, async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM list_items WHERE list_id = ? AND tmdb_id = ?',
            [req.query.list_id, req.query.tmdb_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove item from list' });
    }
});

module.exports = router;