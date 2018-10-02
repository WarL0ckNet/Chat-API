'use strict';

const WhatsApiEventsManager = require('events/whatsApiEventsManager'),
    Constants = require('constants');

let rtrim = (str, chars) => {
    // Convert to string
    str = str.toString();
    // Empty string?
    if (!str) {
        return '';
    }
    // Remove whitespace if chars arg is empty
    if (!chars) {
        return str.replace(/\s+$/, '');
    }
    // Convert to string
    chars = chars.toString();
    // Set vars
    var letters = str.split(''),
        i = letters.length - 1;
    // Loop letters
    for (i; i >= 0; i--) {
        if (chars.indexOf(letters[i]) === -1) {
            return str.substring(0, i + 1);
        }
    }
    return str;
}

module.exports = class Registration {
    constructor(number, debug = false, customPath = false) {
        this.phoneNumber = number;
        this.debug = debug;
        this.eventManager = new WhatsApiEventsManager();
        this.identity = this.buildIdentity(customPath); // directory where identity is going to be saved
    }

    /**
   * Create an identity string.
   *
   * @param  mixed $identity_file IdentityFile (optional).
   *
   * @throws Exception        Error when cannot write identity data to file.
   *
   * @return string           Correctly formatted identity
   */
    buildIdentity(identity_file = false) {
        const path = require('path'),
            fs = require('fs');
        if (!identity_file) {
            identity_file = `${__dirname}${path.sep}${Constants.DATA_FOLDER}${path.sep}id.${this.phoneNumber}.dat`;
        }
        // Check if the provided is not a file but a directory
        if (fs.lstatSync(identity_file).isDirectory()) {
            identity_file = `${rtrim(identity_file, path.sep)}${path.sep}id.${this.phoneNumber}.dat`;
        }
        if ((fs.lstatSync(identity_file) & fs.S_IRUSR)|
        (fs.lstatSync(identity_file) & fs.S_IRGRP)|
        (fs.lstatSync(identity_file) & fs.S_IROTH)) {
            $data = urldecode(file_get_contents($identity_file));
            $length = strlen($data);
            if ($length == 20 || $length == 16) {
                return $data;
            }
        }
        $bytes = strtolower(openssl_random_pseudo_bytes(20));
        if (file_put_contents($identity_file, urlencode($bytes)) === false) {
            throw new Exception('Unable to write identity file to '.$identity_file);
        }
        return $bytes;
    }
}