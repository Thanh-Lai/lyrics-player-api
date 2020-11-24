const express = require('express');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const url = require('url');
const cors = require('cors');
const { fetchTextSearch, checkAuthorization } = require('./methods');
const app = express();
const PORT = 8888;

const createApp = () => {
    app.use(cors());
    // logging middleware
    app.use(morgan('dev'));

    // body parsing middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // compression middleware
    app.use(compression());
    app.use('/auth', require('./auth'));
    // static file-serving middleware
    app.use(express.static('dist'));
    // any remaining requests with an extension (.js, .css, etc.) send 404
    app.use((req, res, next) => {
        if (path.extname(req.path).length) {
            const err = new Error('Not found');
            err.status = 404;
            next(err);
        } else {
            next();
        }
    });

    app.get('/textSearch', (req, res, next) => {
        const urlParse = url.parse(req.url, true);
        const queryObject = urlParse.query;
        const authorization = checkAuthorization(req.headers.authorization);
        if (Object.keys(authorization).length) {
            res.send(authorization);
            return;
        }
        fetchTextSearch(queryObject)
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                console.log(err);
            });
    });

    // error handling endware
    app.use((err, req, res, next) => {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(err.status || 500).send(err.message || 'Internal server error.');
    });

};

const startListening = () => {
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
};

createApp();
startListening();
