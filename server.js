// ============================================
//  server.js  —  MyMovieMania
//  Main Express server entry point
// ============================================

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Middleware ──────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',
        /\.vercel\.app$/          // allow any vercel deployment
    ],
    credentials: true
}));
app.use(express.json());

// ── Serve frontend statically ───────────────
app.use(express.static(path.join(__dirname, 'frontendM')));

// ── API Routes ──────────────────────────────
app.use('/api/auth',    require('./api/auth'));
app.use('/api/movies',  require('./api/movies'));
app.use('/api/library', require('./api/library'));
app.use('/api/lists',   require('./api/lists'));

// ── Catch-all: serve index.html for AngularJS routing ──
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontendM', 'index.html'));
});

// ── Start server ────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ MyMovieMania server running at http://localhost:${PORT}`);
    console.log(`📦 API available at http://localhost:${PORT}/api/`);
});