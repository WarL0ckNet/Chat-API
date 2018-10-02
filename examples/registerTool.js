const debug = true,
    readline = require('readline-sync'),
    fs = require('fs'),
    Registration = require('../src/registration');

console.log('####################\n' +
    '#                  #\n' +
    '# WA Register Tool #\n' +
    '#                  #\n' +
    '####################');

let username = (readline.question("Username (country code + number, do not use + or 00): ")).trim().replace('+', '');

if ((/\D+/).test(username)) {
    console.error("Wrong number. Do NOT use '+' or '00' before your number");
    process.exit(0);
}

identityExists = fs.existsSync(`../src/wadata/id.${username}.dat`);
let w = new Registration(username, debug);
if (identityExists) {
    let option = (readline.question("\nType sms or voice: ")).trim()
    console.log(w.userName);
} else {
    console.log(w.userName);
}