/* 
  Videos/sites being used that may help:
  Using Spotify API with JavaScript - https://medium.com/@awoldt/using-spotify-api-with-javascript-9dd839407f12
  Spotify API OAuth - https://www.youtube.com/watch?v=olY_2MW4Eik&t=1223s
  Learn Express JS in 35 minutes - https://www.youtube.com/watch?v=SccSCuHhOw0  
*/                

const express = require('express');
const app = express();
const request = require('request');
const querystring = require('node:querystring');
require('dotenv').config();
const port = 8084;
const fs = require('fs')

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app.use(express.static('public'));

// This page contains a link that sends you to the Spotify login page
app.get('/', (req, res) => {
    res.render('index.ejs');
});

// When you click on said line you are sent to this
app.get('/login', (req, res) => {
    var state = generateRandomString(16);
    var scope = 'ugc-image-upload user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-read user-follow-modify user-top-read user-read-recently-played user-read-playback-position';

    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.CLIENT_ID,
      scope: scope,
      redirect_uri: process.env.REDIRECT_URI,
      state: state
    }));
});

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

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        access_token = body.access_token;
        process.env.ACCESS_TOKEN = access_token;
      } else {
        console.log(response.body);
        console.log(response.statusMessage);
      }
    });
    res.redirect('/home');
});



app.get('/home', (req, res) => {
    res.render('main/landingPage.ejs');
});
app.get('/topTracks', (req, res) => {
  res.render('main/topTracks.ejs');
});
app.get('/topPodcasts', (req, res) => {
  res.render('main/topPodcasts.ejs');
});

var access_token;
// Refreshes the access token in case it expires
app.get('/refresh_token', function(req, res) {

    var refresh_token = req.query.refresh_token;
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
        access_token = body.access_token;
        refresh_token = body.refresh_token;
        res.send({
          'access_token': access_token,
          'refresh_token': refresh_token
        });
      }
    });
});

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
    res.redirect('/topPodcasts');
    
  });

  app.get('/top-tracks', async (req, res) => {
      let accessToken = process.env.ACCESS_TOKEN;
    try {
    const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50',{
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }

      
    });

    const shortTermResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const mediumTermResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

  

    if (response.status === 200 && shortTermResponse.status === 200 && mediumTermResponse.status === 200) {
      const data = await response.json();
      const shortTermData = await shortTermResponse.json();
      const mediumTermData = await mediumTermResponse.json();

      res.render('main/topTracks.ejs', { tracks: data, shortTermTracks: shortTermData, mediumTermTracks: mediumTermData});
    } else {
      res.send('Failed to retrieve top tracks. Status code: ' + response.status);
    }

    /*
    if (shortTermResponse.status === 200) {
      const data = await shortTermResponse.json();
      console.log(data); // Log the response data for debugging
      res.render('main/topTracks.ejs', { trackss: data });
    } else {
      res.send('Failed to retrieve top tracks. Status code: ' + shortTermResponse.status);
    }
    */


  } catch (error) {
    res.send('An error occurred: ' + error.message);
  }
});



  // -------------------------------//
