// ============================================
//  api/movies.js  —  MyMovieMania
//  Replaces: backend/api/movies.php
//  TMDB API proxy — no auth required
// ============================================

const express = require('express');
const fetch   = require('node-fetch');
require('dotenv').config();

const router   = express.Router();
const TMDB_KEY = process.env.TMDB_KEY;
const TMDB_URL = 'https://api.themoviedb.org/3';

// Helper — fetch from TMDB
async function tmdb(path, params = {}) {
    const url = new URL(`${TMDB_URL}${path}`);
    url.searchParams.set('api_key', TMDB_KEY);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res  = await fetch(url.toString());
    return res.json();
}

// ── TRENDING ─────────────────────────────────
router.get('/trending', async (req, res) => {
    try {
        const data = await tmdb('/trending/movie/week', { page: req.query.page || 1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch trending movies' });
    }
});

// ── POPULAR ──────────────────────────────────
router.get('/popular', async (req, res) => {
    try {
        const data = await tmdb('/movie/popular', { page: req.query.page || 1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch popular movies' });
    }
});

// ── UPCOMING ─────────────────────────────────
router.get('/upcoming', async (req, res) => {
    try {
        const data = await tmdb('/movie/upcoming', { page: req.query.page || 1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch upcoming movies' });
    }
});

// ── TOP RATED ────────────────────────────────
router.get('/toprated', async (req, res) => {
    try {
        const data = await tmdb('/movie/top_rated', { page: req.query.page || 1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch top rated movies' });
    }
});

// ── NOW PLAYING ──────────────────────────────
router.get('/nowplaying', async (req, res) => {
    try {
        const data = await tmdb('/movie/now_playing', { page: req.query.page || 1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch now playing movies' });
    }
});

// ── SEARCH ───────────────────────────────────
router.get('/search', async (req, res) => {
    try {
        const { query, page = 1 } = req.query;
        if (!query) return res.status(400).json({ error: 'Query is required' });
        const data = await tmdb('/search/movie', { query, page, include_adult: false });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to search movies' });
    }
});

// ── MOVIE DETAIL ─────────────────────────────
router.get('/detail', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Movie ID is required' });
        const data = await tmdb(`/movie/${id}`, {
            append_to_response: 'credits,videos,similar,reviews'
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});

// ── GENRES ───────────────────────────────────
router.get('/genres', async (req, res) => {
    try {
        const data = await tmdb('/genre/movie/list');
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch genres' });
    }
});

// ── BY GENRE ─────────────────────────────────
router.get('/bygenre', async (req, res) => {
    try {
        const { genre_id, page = 1 } = req.query;
        if (!genre_id) return res.status(400).json({ error: 'genre_id is required' });
        const data = await tmdb('/discover/movie', {
            with_genres       : genre_id,
            sort_by           : 'popularity.desc',
            page,
            include_adult     : false
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch movies by genre' });
    }
});

module.exports = router;