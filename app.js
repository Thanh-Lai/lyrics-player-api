const http = require("http");
const port = 23450;
const api_key = '912ef887-6982-4247-a2e8-0c28ae96ec38:b177dbd6-6c16-42f3-ae24-d105a30ec2ec';

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