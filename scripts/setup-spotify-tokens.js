const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // keep your explicit .env path

const app = express();
const port = 8888;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${port}/callback`;

function openBrowser(url) {
  const safeUrl = `"${url}"`;
  const cmd =
    process.platform === 'win32'
      ? `start "" ${safeUrl}`
      : process.platform === 'darwin'
        ? `open ${safeUrl}`
        : `xdg-open ${safeUrl}`;

  exec(cmd, (err) => {
    if (err) {
      console.log(`Open this in your browser:\n${url}`);
    }
  });
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env');
  process.exit(1);
}

app.get('/login', (req, res) => {
  const scope = [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-read-recently-played'
  ].join(' ');

  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope,
        redirect_uri: REDIRECT_URI
      })
  );
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  if (!code) {
    res.status(400).send('Missing code param.');
    return;
  }

  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      }
    });

    const refresh_token = response.data.refresh_token;

    console.log('\n==================================================================');
    console.log('✅ SUCCESS! Here is your Refresh Token:');
    console.log('==================================================================');
    console.log(refresh_token);
    console.log('==================================================================\n');
    console.log(`👉 ADD THIS TO YOUR .env FILE: SPOTIFY_REFRESH_TOKEN=${refresh_token}`);
    console.log('------------------------------------------------------------------');

    res.send('<h1>Success! Check your terminal for the Refresh Token.</h1>');
    process.exit(0);
  } catch (error) {
    const data = error.response ? error.response.data : error.message;
    console.error('Token exchange error:', data);
    res.status(500).send('Error retrieving token. Check terminal.');
  }
});

app.listen(port, () => {
  const url = `http://localhost:${port}/login`;
  console.log(`\nLocal Auth Server listening on port ${port}`);
  console.log(`Opening browser...`);
  openBrowser(url);
});
