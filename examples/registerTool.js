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
if (! identityExists) {
    let option = readline.question("\nType sms or voice: ");
    try {
        w.codeRequest(option.trim());
    } catch (e) {
        console.error(e.message);
        process.exit(0);
    }

    let code = (readline.question("\nEnter the received code: ")).replace('-', '');

    try {
        let result = w.codeRegister(code.trim());
        console.log(`Your username is: ${result.login}\n` +
            `Your password is: ${result.pw}`);
    } catch (e) {
        console.error(e.message);
        process.exit(0);
    }
} else {
    try {
        let result = w.checkCredentials();
    } catch (e) {
        console.error(e.message);
        process.exit(0);
    }
}