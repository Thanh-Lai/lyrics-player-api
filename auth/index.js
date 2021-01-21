const router = require('express').Router();
const axios = require('axios');
const querystring = require('querystring');
const NodeCache = require('node-cache');
const myCache = new NodeCache();
const { checkAuthorization } = require('../methods');
const { SPOTIFY_AUTH_TOKEN, spotifyClientID, spotifyRedirectUri, LOCATION } = require('../secrets');
module.exports = router;

const generateRandomString = function(length) {
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
                        'playlist-modify-public', 'playlist-modify-private', 'ugc-image-upload',
                        'user-read-currently-playing', 'app-remote-control', 'streaming'
                    ];
    const scopes = scopesList.join(' ');
    res.send('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: spotifyClientID,
      scope: scopes,
      show_dialog: true,
      redirect_uri: spotifyRedirectUri,
      state: state
    }))
});

router.get('/callback', function(req, res) {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
          querystring.stringify({
            error: 'state_mismatch'
        }));
    }

    const authOptions = {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        params: {
            code: code,
            redirect_uri: spotifyRedirectUri,
            grant_type: 'authorization_code'
        },
        headers: {
            Authorization: `Basic ${Buffer.from(SPOTIFY_AUTH_TOKEN).toString('base64')}`
        },
        json: true
    };
    axios(authOptions)
    .then((response) => {
        response.data['timestamp'] = Date.now();
        myCache.set('spotify_auth_token', response.data, 10000);
    }).catch((err) => {
        console.log(err);
    })
    res.redirect(LOCATION);
});

router.get('/loginStatus', (req, res, next) => {
    const authorization = checkAuthorization(req.headers.authorization);
    if (Object.keys(authorization).length) {
        res.send(authorization);
        return;
    }
    const exists = myCache.has('spotify_auth_token');
    const token = myCache.get('spotify_auth_token');
    if (exists) {
        axios.get('https://api.spotify.com/v1/me', {
            headers: { Authorization: 'Bearer ' + token.access_token },
        }).then((info) => {
            res.send(info.data);
        }).catch((err) => {
            console.log(err);
        });
    } else {
        res.send({});
    }
});

router.get('/logout', (req, res, next) => {
    myCache.del('spotify_auth_token');
    res.send(LOCATION);
})

router.get('/accessToken', (req, res, next) => {
    const authorization = checkAuthorization(req.headers.authorization);
    if (Object.keys(authorization).length) {
        res.send(authorization);
        return;
    }
    const exists = myCache.has('spotify_auth_token');
    const token = myCache.get('spotify_auth_token');
    if (exists) {
        res.send(token);
    } else {
        res.send('No Token');
    }
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
