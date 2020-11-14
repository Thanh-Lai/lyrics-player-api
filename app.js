const http = require("http");
const { api_key } = require('./secrets');
const port = 23450;

const server = http.createServer((req, res) => {
    const authorization = req.headers.authorization;
    if (authorization !== api_key || authorization == undefined) {
        const errMsg = authorization == undefined ? 'No api key provided' : 'Invalid api key';
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({error: { status: 401, message: errMsg }}));
        res.end();
        console.log(res.statusCode, res.statusMessage);
        return;
    }
    if (req.url == '/textSearch') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ data: 'api is online' }));
        res.end();
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({error: { status: 404, message: 'Endpoint not found' }}));
        res.end();
    }
    console.log(res.statusCode, res.statusMessage);
});

server.listen(port, () => {
  console.log(`Server running at ${port}/`);
});