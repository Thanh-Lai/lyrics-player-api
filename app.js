const http = require('http');
const url = require('url');
const { API_KEY } = require('./secrets');
const { fetchTextSearch } = require('./methods');
const port = 23450;

const server = http.createServer((req, res) => {
    const authorization = req.headers.authorization;
    const urlParse = url.parse(req.url, true);
    const pathName = urlParse.pathname;
    const queryObject = urlParse.query;

    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!authorization || authorization !== API_KEY) {
        const errMsg = authorization === undefined ? 'No api key provided' : 'Invalid api key';
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({error: { status: 401, message: errMsg }}));
        res.end();
        console.log(res.statusCode, res.statusMessage);
        return;
    }
    if ( pathName === '/textSearch') {
        fetchTextSearch(queryObject)
        .then((response) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ data: response }));
            res.end();
            console.log(res.statusCode, res.statusMessage);
        })
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({error: { status: 404, message: 'Endpoint not found' }}));
        res.end();
        console.log(res.statusCode, res.statusMessage);
    }
});

server.listen(port, () => {
  console.log(`Server running at ${port}/`);
});
