const router = require('express').Router();
const axios = require('axios');
const querystring = require('querystring');
const { checkAuthorization } = require('../methods');
const { SPOTIFY_AUTH_TOKEN, spotifyClientID, spotifyRedirectUri } = require('../secrets');

module.exports = router;

var generateRandomString = function(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

router.get('/login', (req, res, next) => {
    const authorization = checkAuthorization(req.headers.authorization);
    const state = generateRandomString(16);
    if (Object.keys(authorization).length) {
        res.send(authorization);
        return;
    }
    const scopesList = [
                        'user-read-private', 'user-read-email', 'user-read-playback-state',
                        'user-modify-playback-state', 'playlist-read-private',
                        'playlist-modify-public', 'playlist-modify-private'
                    ];
    const scopes = scopesList.join(' ');
    res.send('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: spotifyClientID,
      scope: scopes,
      redirect_uri: spotifyRedirectUri,
      state: state
    }))
});

router.get('/callback', function(req, res) {
    console.log(req, res)
})

router.get('/token', (req, res, next) => {
    const authorization = checkAuthorization(req.headers.authorization);
    if (Object.keys(authorization).length) {
        res.send(authorization);
        return;
    }
    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          Authorization: `Basic ${Buffer.from(SPOTIFY_AUTH_TOKEN).toString('base64')}`
        },
        params: {
          'grant_type': 'client_credentials'
        },
        json: true
      }).then((token) => {
            res.send(token.data);
    }).catch((err) => {
        console.log(err);
    });
});
