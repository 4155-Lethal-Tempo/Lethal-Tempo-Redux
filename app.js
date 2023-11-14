/* 
  Videos/sites being used that may help:
  Using Spotify API with JavaScript - https://medium.com/@awoldt/using-spotify-api-with-javascript-9dd839407f12
  Spotify API OAuth - https://www.youtube.com/watch?v=olY_2MW4Eik&t=1223s
  Learn Express JS in 35 minutes - https://www.youtube.com/watch?v=SccSCuHhOw0  
*/                

const express = require('express');
const session = require('express-session');
const request = require('request');
const querystring = require('node:querystring');
const mongoose = require('mongoose');
const User = require('./models/user');
const Track = require('./models/track');
const Comment = require('./models/comment');

const app = express();
require('dotenv').config();
require('isomorphic-fetch');

// Local DB: mongodb://127.0.0.1:27017/testDB2
mongoose.connect('mongodb://127.0.0.1:27017/testDB2')
  .then(() => console.log('\nMongoDB Connected…'))
  .catch(err => console.log(err)
);

const port = 8084;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app.use(session({
  secret: "SuperSecretKey",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Change to true when using HTTPS
}));

app.use(express.static('public'));

// This is the callback page that is called after you login
// It is supposed to give you an access token and a refresh token
// We'll use this to make API calls
app.get('/callback', function(req, res) {
    var code = req.query.code || null;
    var state = req.query.state || null;
  
    if (state === null) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: process.env.REDIRECT_URI,
          grant_type: 'authorization_code'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + (new Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
        },
        json: true
      };
    }

    request.post(authOptions, async function(error, response, body) {
      if (!error && response.statusCode === 200) {
        req.session.access_token = body.access_token;
        req.session.refresh_token = body.refresh_token;
        req.session.access_token_received_at = Date.now();
        
        // Get the user's profile
        const user = await getUserProfile(req.session.access_token);
        const spotify_id = user.id;

        // Check if the user exists in the database
        let dbUser = await User.findOne({ spotify_id: spotify_id });

        // If the user doesn't exist, create a new document/entry in the database
        if (!dbUser) {
          dbUser = new User({ spotify_id: spotify_id });
          await dbUser.save();
        } else {
          // If the user exists, save the user's ID in the session
          req.session.userDB = dbUser
        }

        res.redirect('/');
      } else {
        console.log(response.body);
        console.log(response.statusMessage);
      }
    });
});

// This page contains a link that sends you to the Spotify login page - or redirects you to the home page if you're already logged in
app.get('/', async (req, res)  => {
  var access_token = req.session.access_token;

  if (access_token == null || access_token == '' || access_token == undefined) {
    res.render('index.ejs');
  } else {
    try {
      const user = await getUserProfile(req.session.access_token);
      req.session.user = user; // Store the user profile in the session - so we can access it later
      console.log(`\nSuccessfully logged in ${user.display_name}`);
      res.redirect('/home');
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Redirect to login or refresh the token here
      res.redirect('/login');
    }
  }
});

// This route handles the scope, client id, redirect uri, and state. It then redirects you to the callback to get the access token
app.get('/login', (req, res) => {
    var state = generateRandomString(16);
    var scope = 'user-library-read ugc-image-upload user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-read user-follow-modify user-top-read user-read-recently-played user-read-playback-position';

    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.CLIENT_ID,
      scope: scope,
      redirect_uri: process.env.REDIRECT_URI,
      state: state
    }));
});

// logs you out - work in progress
app.get('/logout', (req, res) => {
  
  // Check if there is a session
  if(req.session.access_token){
    console.log(`\nLogging out ${req.session.user.display_name}`);
  }
  
  // destroy the session
  req.session.destroy();

  // Redirect to the login page
  res.redirect('/');
});

app.get('/home', (req, res) => {
    res.render('main/landingPage.ejs', { user: req.session.user });
});

// Refreshes the access token in case it expires
app.get('/refresh_token', function(req, res) {

    var refresh_token = req.session.refresh_token;
    var authString = process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET;
    
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + authString.toString('base64') 
      },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
  
    
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        req.session.access_token = body.access_token;
        req.session.refresh_token = body.refresh_token;
        res.send({
          'access_token': req.session.access_token,
          'refresh_token': req.session.refresh_token
        });
      }
    });
});

// Checks if the access token has expired - returns true if it has, false otherwise
function accessTokenHasExpired(req) {
  // Assume the access token expires in 1 hour (3600 seconds)
  const EXPIRATION_TIME = 3600 * 1000; // Convert to milliseconds

  // Get the time the access token was received from the session
  const accessTokenReceivedAt = req.session.access_token_received_at;

  // Check if the current time is past the expiration time of the access token
  return Date.now() > accessTokenReceivedAt + EXPIRATION_TIME;
}

// Generates a random string containing numbers and letters - used for state
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        result += characters.charAt(randomIndex);
    }
    return result;
}
  
app.get('/top-podcasts', async (req, res) => {
  if(accessTokenHasExpired(req)){
    try {
      const { data } = await axios.get('/refresh_token');
      req.session.access_token = data.access_token;
      req.session.access_token_received_at = Date.now();
    } catch (error) {
        console.error('Error refreshing access token', error);
    }
  } else {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/shows',{
        headers: {
          'Authorization': `Bearer ${req.session.access_token}`
        }
      });

      const episodeResponse = await fetch('https://api.spotify.com/v1/me/episodes', {
        headers: {
          'Authorization': `Bearer ${req.session.access_token}`
        }
      });


      if (response.status === 200 && episodeResponse.status === 200) {
        const sdata = await response.json();
        const episodesData = await episodeResponse.json();
        res.render('main/topPodcasts.ejs', { 
          shows: sdata,
          episodes: episodesData, 
          user: req.session.user
        });
      } else {
          res.send('Failed to retrieve podcasts. Status code: ' + response.status);
        }
    } catch (error) {
      res.send('An error occurred: ' + error.message);
    }
  }
  
});

  app.get('/top-tracks', async (req, res) => {
    if(accessTokenHasExpired(req)){
      try {
        const { data } = await axios.get('/refresh_token');
        req.session.access_token = data.access_token;
        req.session.access_token_received_at = Date.now();
      } catch (error) {
          console.error('Error refreshing access token', error);
      }
    } else {
      try {
        const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50',{
          headers: {
            'Authorization': `Bearer ${req.session.access_token}`
          }
        });
    
        const shortTermResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50', {
          headers: {
            'Authorization': `Bearer ${req.session.access_token}`
          }
        });
    
        const mediumTermResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50', {
          headers: {
            'Authorization': `Bearer ${req.session.access_token}`
          }
        });
    
        if (response.status === 200 && shortTermResponse.status === 200 && mediumTermResponse.status === 200) {
          const data = await response.json();
          const shortTermData = await shortTermResponse.json();
          const mediumTermData = await mediumTermResponse.json();
    
          res.render('main/topTracks.ejs', { 
            tracks: data, 
            shortTermTracks: shortTermData, 
            mediumTermTracks: mediumTermData,
            user: req.session.user
          });
        } else {
          res.send('Failed to retrieve top tracks. Status code: ' + response.status);
        }
      } catch (error) {
        res.send('An error occurred: ' + error.message);
      }
    }
});

// Go to the song page of a track we clicked on
app.get('/track/:id', async (req, res) => {
  const id = req.params.id;

  if(accessTokenHasExpired(req)){
    try {
      const { data } = await axios.get('/refresh_token');
      req.session.access_token = data.access_token;
      req.session.access_token_received_at = Date.now();
    } catch (error) {
        console.error('Error refreshing access token', error);
    }
  } else {
    try {
      const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: {
          'Authorization': `Bearer ${req.session.access_token}`
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        console.log(`\nGetting track ${data.name}`);

        // Check if track exists in the database
        let track = await Track.findOne({ track_id: id });

        // If track doesn't exist, create a new track
        if (!track) {
          track = new Track({ track_id: id });
          await track.save();
        }

        // Get the user's profile
        const userDB = await getUserProfile(req.session.access_token);
        const spotify_id = userDB.id;

        // update the user we have stored in the session - just in case
        req.session.userDB = await User.findOne({ spotify_id: spotify_id });

        res.render('main/track.ejs', { 
          track: data, 
          user: req.session.user, 
          trackDB: track,
          userDB: req.session.userDB
        });
      } else {
        res.send('Failed to retrieve track. Status code: ' + response.status);
      }
    } catch (error) {
      res.send('An error occurred: ' + error.message);
    }
  }
});

//Go to the podcast page of show you click on
app.get('/show/:id', async (req, res) => {
  const id = req.params.id;

  if (accessTokenHasExpired(req)) {
    try {
      const { data } = await axios.get('/refresh_token');
      req.session.access_token = data.access_token;
      req.session.access_token_received_at = Date.now();
    } catch (error) {
      console.error('Error refreshing access token', error);
    }
  } else {
    try {
      const response = await fetch(`https://api.spotify.com/v1/shows/${id}`, {
        headers: {
          'Authorization': `Bearer ${req.session.access_token}`
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        // console.log(data); // Log the response data for debugging
        res.render('main/show.ejs', { show: data, user: req.session.user });
      } else {
        res.send('Failed to retrieve show. Status code: ' + response.status);
      }
    } catch (error) {
      res.send('An error occurred: ' + error.message);
    }
  }
});

//Go to the episode page of episode you click on
app.get('/episode/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);

  if (accessTokenHasExpired(req)) {
    try {
      const { data } = await axios.get('/refresh_token');
      req.session.access_token = data.access_token;
      req.session.access_token_received_at = Date.now();
    } catch (error) {
      console.error('Error refreshing access token', error);
    }
  } else {
    try {
      const response = await fetch(`https://api.spotify.com/v1/episodes/${id}`, {
        headers: {
          'Authorization': `Bearer ${req.session.access_token}`
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        // console.log(data); // Log the response data for debugging
        res.render('main/episode.ejs', { episode: data, user: req.session.user });
      } else {
        res.send('Failed to retrieve episode. Status code: ' + response.status);
      }
    } catch (error) {
      res.send('An error occurred: ' + error.message);
    }
  }
});

// This gets user's profile - using getUserProfile function
app.get('/me', async (req, res) => {
  if(accessTokenHasExpired(req)){
    try {
      const { data } = await axios.get('/refresh_token');
      req.session.access_token = data.access_token;
      req.session.access_token_received_at = Date.now();
    } catch (error) {
        console.error('Error refreshing access token', error);
    }
  } else {
    res.render('main/profile.ejs', { user: req.session.user });
  }

});

async function getUserProfile(accessToken) {
  const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
  });

  if (response.status !== 200) {
    res.redirect('/')
    throw new Error('Failed to get user profile');
  }

  const userProfile = await response.json();
  return userProfile;
}

app.get('/contact',(req, res) => {
  res.render('main/contact.ejs');
});
app.get('/about',(req, res) => {
  res.render('main/about.ejs');
});

app.get('/rated-tracks', async (req, res) => {
  const userId = req.session.userDB.spotify_id;
  let user = await User.findOne({ spotify_id: userId });

  let likedTracksDetails = await Promise.all(user.liked_tracks.map(async (trackId) => {
    let response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`
      }
    });
    return response.json();
  }));

  let dislikedTracksDetails = await Promise.all(user.disliked_tracks.map(async (trackId) => {
    let response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`
      }
    });
    return response.json();
  }));

  res.render('main/rated-tracks.ejs', { likedTracks: likedTracksDetails, dislikedTracks: dislikedTracksDetails });
});

/********** Likes and Dislikes **********/
app.get('/like/:trackId', async (req, res) => {
  // Get trackID and userID
  const trackId = req.params.trackId;
  const userId = req.session.userDB.spotify_id;

  // Find the user and track in the database
  let user = await User.findOne({ spotify_id: userId });
  let track = await Track.findOne({ track_id: trackId });

  // If the track doesn't exist, create a new track
  if (!track) {
    track = new Track({ track_id: trackId });
  }

  // If the user has already disliked the track, remove the dislike
  if (user.disliked_tracks.includes(trackId)) {
    const index = user.disliked_tracks.indexOf(trackId);
    user.disliked_tracks.splice(index, 1);
    track.dislikes -= 1;
  }

  // If the user hasn't liked the track, add the like
  if (!user.liked_tracks.includes(trackId)) {
    user.liked_tracks.push(trackId);
    track.likes += 1;
  }

  // Save the track and user in the database
  await track.save();
  await user.save();

  // Redirect to the track page - so we can see the changes
  res.redirect(`/track/${trackId}`);
});

app.get('/dislike/:trackId', async (req, res) => {
  // Get trackID and userID
  const trackId = req.params.trackId;
  const userId = req.session.userDB.spotify_id;

  // Find the user and track in the database
  let user = await User.findOne({ spotify_id: userId });
  let track = await Track.findOne({ track_id: trackId });

  // If the track doesn't exist, create a new track
  if (!track) {
    track = new Track({ track_id: trackId });
  }

  // If the user has already liked the track, remove the like
  if (user.liked_tracks.includes(trackId)) {
    const index = user.liked_tracks.indexOf(trackId);
    user.liked_tracks.splice(index, 1);
    track.likes -= 1;
  }

  // If the user hasn't disliked the track, add the dislike
  if (!user.disliked_tracks.includes(trackId)) {
    user.disliked_tracks.push(trackId);
    track.dislikes += 1;
  }

  // Save the track and user in the database
  await track.save();
  await user.save();

  // Redirect to the track page - so we can see the changes
  res.redirect(`/track/${trackId}`);
});