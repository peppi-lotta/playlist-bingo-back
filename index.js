const express = require('express')
const dotenv = require('dotenv')
const uuid = require('uuid');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const Game = require('./games');
const Bingo = require('./bingos');
const { generateRandomCode, formGameTracks, formBingoTracks } = require('./helper');
const { createGamesTable, createBingosTable } = require('./vercel-db');

dotenv.config()
const app = express();
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET_KEY],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours or as per your needs
  secure: true, // Mark the cookie as secure for HTTPS
  sameSite: 'none', // Set SameSite attribute to 'None'
}));
app.use(cookieParser());
app.use(cors({
  origin: process.env.BASE_URL, // Replace with your React app's domain
  credentials: true,
}));

const port = 5001;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

app.get('/auth/spotify', async (req, res) => {
  const scope = 'user-read-private user-read-email playlist-read-private'; // Specify the required scopes
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}`;
  res.redirect(authUrl);
});

app.get('/auth/spotify/callback', async (req, res) => {
  const { code } = req.query;
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append('redirect_uri', redirectUri);

    const fetchOptions = {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const response = await fetch(tokenUrl, fetchOptions);

    if (response.ok) {
      const data = await response.json();
      const { access_token } = data;

      const sessionID = uuid.v4();

      // Set the 'connect.sid' session cookie with SameSite and secure attributes
      res.cookie('connect.sid', sessionID, { secure: true, sameSite: 'none' });

      // Store the access token in the user's session
      res.cookie('token', access_token, { secure: true, sameSite: 'none' });

      res.redirect(`${process.env.BASE_URL}/host`);
    } else {
      console.error('Request failed with status:', response.status);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
});



app.get('/api/playlists', async (req, res) => {

  const offset = req.query.offset
  const limit = req.query.limit
  const token = req.cookies.token;
  const playlistUrl = `https://api.spotify.com/v1/me/playlists?offset=${offset}&limit=${limit}`;

  try {
    const response = await fetch(playlistUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    const playlists = data.items

    res.status(200).json({ playlists });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch data" + error });
  }
});

app.get('/api/start-game', async (req, res) => {

  const token = req.cookies.token;
  const playlist_id = req.query.playlist_id
  const count = 30;

  try {

    const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const playlist = await playlistResponse.json();

    let game = new Game();
    game.code = generateRandomCode(6, true);
    game.tracks_url = playlist.tracks.href;
    game.tracks_count = playlist.tracks.total;

    const response = await fetch(playlist.tracks.href, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    const playlist_tracks = data.items;
    let game_tracks = [];

    game_tracks = formGameTracks(game_tracks, playlist_tracks, game.tracks_count, count);
    game.game_tracks = game_tracks

    game = await game.create()

    if (game.game_tracks.length < count) {
      const rec_limit = 100;
      let seed_artists = game.game_tracks[0].artist_id;
      for (let i = 1; i < 5; i++) {
        if (typeof game.game_tracks[i].artist_id === "undefined") {
          continue
        }
        seed_artists += '%2C' + game.game_tracks[i].artist_id;
      }

      const recomendationsUrl = `https://api.spotify.com/v1/recommendations?limit=${rec_limit}&seed_artists=${seed_artists}`;
      game.recommendations_url = recomendationsUrl

      try {
        const response = await fetch(recomendationsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        const recommendation_tracks = data.tracks
        game_tracks = formGameTracks(game.game_tracks, recommendation_tracks, recommendation_tracks.length, count)
        game.game_tracks = game_tracks
        game = await game.update()
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch data" + error });
      }
    }

    res.status(200).json(game);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch data " + error });
  }
});

app.get('/auth/bingo', async (req, res) => {
  const code = req.query.code;
  const name_tag = req.query.name_tag;
  const bingo_count = 15;
  const game_count = 30;
  const game = await Game.get(code);
  let bingo = new Bingo();

  bingo.code = generateRandomCode(5);
  bingo.game_code = game.code;
  bingo.name_tag = name_tag;
  const bingo_tracks = formBingoTracks(game.game_tracks, bingo_count, game_count);
  bingo.bingo_tracks = bingo_tracks;

  bingo = await bingo.create();

  res.status(200).json(bingo);
  try {
  } catch (error) {
    console.log(error);
  }

});

app.get('/check-bingo', async (req, res) => {
  try {
    const currentTrack = req.query.current_track;
    const gameCode = req.query.game_code;
    const bingoCode = req.query.bingo_code;
    const win = req.query.win

    const game = await Game.get(gameCode);
    const isBingo = await game.checkForBingo(bingoCode, currentTrack, win)

    let data = {
      success: isBingo,
    };

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
});

app.get('/create-games', async (req, res) => {
  try {
    createGamesTable()
  } catch (error) {
    console.log(error);
  }
});

app.get('/create-bingo', async (req, res) => {
  try {
    createBingosTable()
  } catch (error) {
    console.log(error);
  }
});

app.get('/get-game', async (req, res) => {
  try {
    const { code } = req.query;
    const game = await Game.get(code);
    res.status(200).json(game);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
});

app.get('/', (req, res) => {
  try {
    let data = {
      message: 'This is playlist bingo backend.',
    };
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }

});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;