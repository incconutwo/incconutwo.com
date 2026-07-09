const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 8888;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in your .env file before running this script.');
  process.exit(1);
}

app.get('/login', (req, res) => {
  const scopes = [
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-top-read' // Required for fetching Top Tracks!
  ].join(' ');

  const authUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scopes,
    redirect_uri: REDIRECT_URI,
    show_dialog: true
  }).toString();

  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.send('❌ Authorization failed: code missing.');
  }

  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      }
    });

    const { refresh_token, access_token } = response.data;

    // Update .env file
    const envPath = path.join(__dirname, '../.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Replace or add SPOTIFY_REFRESH_TOKEN
    const regex = /^SPOTIFY_REFRESH_TOKEN=.*$/m;
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `SPOTIFY_REFRESH_TOKEN=${refresh_token}`);
    } else {
      envContent += `\nSPOTIFY_REFRESH_TOKEN=${refresh_token}`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    console.log('\n=============================================');
    console.log('✅ Spotify Authorization Successful!');
    console.log(`Access Token: ${access_token.substring(0, 15)}...`);
    console.log(`Refresh Token: ${refresh_token}`);
    console.log('Saved to .env successfully!');
    console.log('=============================================\n');

    res.send('<h1>✅ Authorization Successful!</h1><p>You can close this tab and check your terminal.</p>');
    
    setTimeout(() => {
      console.log('Shutting down local auth server...');
      process.exit(0);
    }, 1000);

  } catch (error) {
    console.error('❌ Error exchanging code for token:', error.response?.data || error.message);
    res.send(`<h1>❌ Error</h1><p>${error.message}</p>`);
  }
});

app.listen(PORT, () => {
  console.log('=============================================');
  console.log(`Spotify Auth Server running at http://localhost:${PORT}`);
  console.log(`Please visit http://localhost:${PORT}/login to authenticate.`);
  console.log('=============================================');
});
