'use strict';
const fs = require('fs'),
path = require('path'),
readline = require('readline');

let rd = readline.createInterface({
    input: fs.createReadStream(`${__dirname}${path.sep}src${path.sep}countries.csv`)
});

rd.on('line', (line) => {
    let data = line.replace(/"/g,'').split(',');
    console.log(data);
});