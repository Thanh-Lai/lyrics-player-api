const router = require('express').Router();
const axios = require('axios');
const { checkAuthorization } = require('../methods');
const { SPOTIFY_AUTH_TOKEN } = require('../secrets');


module.exports = router;

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
