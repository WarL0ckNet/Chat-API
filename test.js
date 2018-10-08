'use strict';

const https = require('https');

const options =
{
    hostname: 'v.whatsapp.net',
    port: null,
    protocol: 'https:',
    path:
        '/v2/exist?cc=79&in=930206295&lg=ru&lc=RU&id=H%1C%EF%BF%BD%1A%EF%BF%BD%EF%BF%BDE%10%3A%EF%BF%BD%EF%BF%BDIu%18%EF%BF%BD%EF%BF%BD%EF%BF%BD%2B-%EF%BF%BD&mistyped=6&network_radio_type=1&simnum=1&s=&copiedrc=1&hasinrc=1&rcmatch=1&pid=5199&extexist=1&extstate=1',
    method: 'GET'
};

const req = https.request(options, (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);
    res.on('data', (d) => {
        console.log(JSON.parse(d));
    });
    res.on('end', () => {
        console.log('end');
    });
});
req.end();
req.on('error', (err) => {
    console.error(err);
});