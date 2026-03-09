# MyMovieMania — Node.js Backend

## Setup Instructions

### 1. Install dependencies
```bash
npm install
```

### 2. Create your .env file
```bash
# Copy the example file
cp .env.example .env

# Then edit .env and fill in:
TMDB_KEY=your_tmdb_key_here
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=mymoviemania
PORT=3000
```

### 3. Make sure XAMPP MySQL is running
- Open XAMPP Control Panel
- Start MySQL only (Apache no longer needed!)
- Database is still: mymoviemania (same as before)

### 4. Replace movie.service.js in your frontend
- Copy movie.service.js into: frontendM/app/services/movie.service.js

### 5. Run the server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

### 6. Open the app
```
http://localhost:3000
```

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Sign in |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/updateProfile | Update bio/username |
| GET | /api/movies/trending | Trending films |
| GET | /api/movies/popular | Popular films |
| GET | /api/movies/search?query= | Search films |
| GET | /api/movies/detail?id= | Movie detail |
| GET | /api/library/watchlist.get | Get watchlist |
| POST | /api/library/watchlist.add | Add to watchlist |
| POST | /api/library/watched.add | Mark as watched |
| POST | /api/library/reviews.add | Submit review |
| GET | /api/lists/get | Get my lists |
| POST | /api/lists/create | Create list |
| POST | /api/lists/addItem | Add film to list |

## Deploying to Vercel

1. Push this entire folder to GitHub
2. Go to vercel.com → New Project → Import repo
3. Add environment variables in Vercel dashboard:
   - TMDB_KEY
   - DB_HOST (your PlanetScale host)
   - DB_USER
   - DB_PASS
   - DB_NAME
4. Click Deploy — done!