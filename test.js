'use strict';

/*
const Registration = require('./src/registration');

try {
    let w = new Registration('79134547579', true);
} catch (e) {
    console.error(e.message);
}
*/

const crypto = require('crypto');

console.log(crypto.createHash('md5').update(crypto.randomBytes(20)).digest('hex'));