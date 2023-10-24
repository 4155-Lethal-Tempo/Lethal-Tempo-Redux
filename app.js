/* 
  Videos/sites being used that may help:
  Using Spotify API with JavaScript - https://medium.com/@awoldt/using-spotify-api-with-javascript-9dd839407f12
  Spotify API OAuth - https://www.youtube.com/watch?v=olY_2MW4Eik&t=1223s
  Learn Express JS in 35 minutes - https://www.youtube.com/watch?v=SccSCuHhOw0  
*/                

const express = require('express');
const app = express();
const querystring = require('node:querystring');
require('dotenv').config();
const port = 8084;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// This page contains a link that sends you to the Spotify login page
app.get('/', (req, res) => {
    res.render('index.ejs');
});

// When you click on said line you are sent to this
app.get('/login', (req, res) => {
    var state = generateRandomString(16);
    var scope = 'user-read-private user-read-email';

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
app.get('/callback', async (req, res) => {
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
          'Authorization': 'Basic ' + (new Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
        },
        json: true
      };
    }
    console.log(authOptions);
    res.redirect('/home');
});

app.get('/home', (req, res) => {
    res.render('main/landingPage.ejs');
});

// Refreshes the access token in case it expires
app.get('/refresh_token', function(req, res) {

    var refresh_token = req.query.refresh_token;
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
  
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        res.send({
          'access_token': access_token
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