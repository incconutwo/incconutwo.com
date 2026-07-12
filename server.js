const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 1. Security: Helmet for robust HTTP headers
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP here since it is set via meta tag in index.html
}));

// 2. Security: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all /api/ routes
app.use('/api/', limiter);

// Enable CORS
app.use(cors());

// Enable JSON parsing for request bodies
app.use(express.json());

// Mock Vercel Insights for local development
app.get('/_vercel/insights/script.js', (req, res) => {
  res.type('application/javascript').send('// Mock Vercel Insights');
});

// Serve built Astro folder
app.use(express.static(path.join(__dirname, 'dist')));

// 3. Mount Modular API Routers
const spotifyRouter = require('./server/routes/spotify');
const lichessRouter = require('./server/routes/lichess');
const notifyRouter = require('./server/routes/notify');
const steamRouter = require('./server/routes/steam');

app.use('/api/spotify', spotifyRouter);
app.use('/api/lichess', lichessRouter);
app.use('/api/notify', notifyRouter);
app.use('/api/steam', steamRouter);


// Start listeners if local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
  });
}

module.exports = app;
