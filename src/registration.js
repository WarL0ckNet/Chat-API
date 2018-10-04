'use strict';

const WhatsApiEventsManager = require('./events/whatsApiEventsManager'),
    Constants = require('./constants'),
    Utils = require('./utils');

module.exports = class Registration {
    constructor(number, debug = false, customPath = false) {
        this.phoneNumber = number;
        this.debug = debug;
        this.eventManager = new WhatsApiEventsManager();
        this.identity = this.buildIdentity(customPath); // directory where identity is going to be saved
    }

    /**
   * Check if account credentials are valid.
   *
   * NOTE: WhatsApp changes your password everytime you use this.
   *       Make sure you update your config file if the output informs about
   *       a password change.
   *
   * @throws Exception
   *
   * @return object
   *   An object with server response.
   *   - status: Account status.
   *   - login: Phone number with country code.
   *   - pw: Account password.
   *   - type: Type of account.
   *   - expiration: Expiration date in UNIX TimeStamp.
   *   - kind: Kind of account.
   *   - price: Formatted price of account.
   *   - cost: Decimal amount of account.
   *   - currency: Currency price of account.
   *   - price_expiration: Price expiration in UNIX TimeStamp.
   */
    checkCredentials() {
        let phone = this.dissectPhone();
        if (!phone) {
            throw new Error('The provided phone number is not valid.');
        }
        let countryCode = (phone.ISO3166 != '' ? phone.ISO3166 : 'US');
        let langCode = (phone.ISO639 != '' ? phone.ISO639 : 'en');
        // Build the url.
        let host = `https://${Constants.WHATSAPP_CHECK_HOST}`;
        let query = {
            cc: phone.cc,
            in: phone.phone,
            lg: langCode,
            lc: countryCode,
            id: this.identity,
            mistyped: '6',
            network_radio_type: '1',
            simnum: '1',
            s: '',
            copiedrc: '1',
            hasinrc: '1',
            rcmatch: '1',
            pid: 100 + Math.floor(9900 * Math.random()),
            //'rchash' => hash('sha256', openssl_random_pseudo_bytes(20)),
            //'anhash' => md5(openssl_random_pseudo_bytes(20)),
            extexist: '1',
            extstate: '1'
        };
        this.debugPrint(query);
        let response = this.getResponse(host, query);
        this.debugPrint(response);

        if (response.status != 'ok') {
            this.eventManager().fire('onCredentialsBad',
                [
                    this.phoneNumber,
                    response.status,
                    response.reason,
                ]);
            throw new Error('There was a problem trying to request the code.');
        } else {
            this.eventManager().fire('onCredentialsGood',
                [
                    this.phoneNumber,
                    response.login,
                    response.pw,
                    response.type,
                    response.expiration,
                    response.kind,
                    response.price,
                    response.cost,
                    response.currency,
                    response.price_expiration
                ]);
        }
        return response;
    }

    /**
   * Register account on WhatsApp using the provided code.
   *
   * @param int $code
   *   Numeric code value provided on requestCode().
   *
   * @throws Exception
   *
   * @return object
   *   An object with server response.
   *   - status: Account status.
   *   - login: Phone number with country code.
   *   - pw: Account password.
   *   - type: Type of account.
   *   - expiration: Expiration date in UNIX TimeStamp.
   *   - kind: Kind of account.
   *   - price: Formatted price of account.
   *   - cost: Decimal amount of account.
   *   - currency: Currency price of account.
   *   - price_expiration: Price expiration in UNIX TimeStamp.
   */
    codeRegister(code) {
        let phone = this.dissectPhone();
        if (!phone) {
            throw new Error('The provided phone number is not valid.');
        }
        const crypto = require('crypto');
        code = code.replace('-', '');
        let countryCode = (phone.ISO3166 != '' ? phone.ISO3166 : 'US');
        let langCode = (phone.ISO639 != '' ? phone.ISO639 : 'en');
        // Build the url.
        let host = `https://${Constants.WHATSAPP_REGISTER_HOST}`;
        let query = {
            cc: phone.cc,
            in: phone.phone,
            lg: langCode,
            lc: countryCode,
            id: this.identity,
            mistyped: '6',
            network_radio_type: '1',
            simnum: '1',
            s: '',
            copiedrc: '1',
            hasinrc: '1',
            rcmatch: '1',
            pid: 100 + Math.floor(9900 * Math.random()),
            rchash: crypto.createHash('sha256').update(crypto.randomBytes(20)),
            anhash: crypto.createHash('md5').update(crypto.randomBytes(20)),
            extexist: '1',
            extstate: '1',
            code: code,
        };
        this.debugPrint(query);
        response = this.getResponse(host, query);
        this.debugPrint(response);

        if (response.status != 'ok') {
            this.eventManager().fire('onCodeRegisterFailed',
                [
                    this.phoneNumber,
                    response.status,
                    response.reason,
                    (response.retry_after ? response.retry_after : null),
                ]);
            if (response.reason == 'old_version') {
                this.update();
            }
            throw new Error(`An error occurred registering the registration code from WhatsApp. Reason: ${response.reason}`);
        } else {
            this.eventManager().fire('onCodeRegister',
                [
                    this.phoneNumber,
                    response.login,
                    response.pw,
                    response.type,
                    response.expiration,
                    response.kind,
                    response.price,
                    response.cost,
                    response.currency,
                    response.price_expiration,
                ]);
        }
        return response;
    }

    /**
   * Get a decoded JSON response from Whatsapp server.
   *
   * @param  string $host  The host URL
   * @param  array  $query A associative array of keys and values to send to server.
   *
   * @return null|object   NULL if the json cannot be decoded or if the encoded data is deeper than the recursion limit
   */
    getResponse(host, query) {
        const qs = require('querystring'),
            http = require('http');
        let options = {
            host,
            path: `?${qs.stringify(query)}`,
            method: 'GET',
            agent: Constants.WHATSAPP_USER_AGENT,
            headers: {
                'Accept': 'text/json'
            }
        };
        const req = http.request(options, (res) : {
            let response;
            res.setEncoding('utf8');
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.on('data', (chunk) => {
                response += chunk;
            });
            res.on('end', () => {
                console.log('No more data in response.');
            });
        });
        // Open connection.
        $ch = curl_init();
        // Configure the connection.
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_USERAGENT, Constants:: WHATSAPP_USER_AGENT);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: text/json']);
        // This makes CURL accept any peer!
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        // Get the response.
        $response = curl_exec($ch);
        // Close the connection.
        curl_close($ch);
        return json_decode($response);
    }

    /**
     * Dissect country code from phone number.
     *
     * @return array
     *   An associative array with country code and phone number.
     *   - country: The detected country name.
     *   - cc: The detected country code (phone prefix).
     *   - phone: The phone number.
     *   - ISO3166: 2-Letter country code
     *   - ISO639: 2-Letter language code
     *   Return false if country code is not found.
     */
    dissectPhone() {
        const fs = require('fs'),
            readline = require('readline');

        let rd = readline.createInterface({
            input: fs.createReadStream(__dirname + '/countries.csv'),
            output: process.stdout,
            console: false
        });

        rd.on('line', (line) => {
            data = line.replace('"', '').split(',');
            if (this.phoneNumber.indexOf(data[1]) === 0) {
                // Return the first appearance.
                let mcc = data[2].split('|');
                mcc = mcc[0];
                //hook:
                //fix country code for North America
                if (data[1][0] == '1') {
                    data[1] = '1';
                }
                let phone = {
                    country: data[0],
                    cc: data[1],
                    phone: this.phoneNumber.substr(data[1].length),
                    mcc: mcc,
                    ISO3166: data[3],
                    ISO639: data[4],
                    mnc: data[5]
                };
                this.eventManager().fire('onDissectPhone',
                    [
                        this.phoneNumber,
                        phone.country,
                        phone.cc,
                        phone.phone,
                        phone.mcc,
                        phone.ISO3166,
                        phone.ISO639,
                        phone.mnc
                    ]
                );
                return phone;
            }
        });
        this.eventManager().fire('onDissectPhoneFailed',
            [
                this.phoneNumber,
            ]);
        return false;
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
            fs = require('fs'),
            urlencode = require('urlencode');
        if (!identity_file) {
            identity_file = `${__dirname}${path.sep}${Constants.DATA_FOLDER}${path.sep}id.${this.phoneNumber}.dat`;
        }
        // Check if the provided is not a file but a directory
        if (fs.existsSync(identity_file)) {
            if (fs.lstatSync(identity_file).isDirectory()) {
                identity_file = `${Utils.rtrim(identity_file, path.sep)}${path.sep}id.${this.phoneNumber}.dat`;
            }
            let data = urlencode.decode(fs.readFileSync(identity_file));
            console.log('r>' + data.length);
            if (data.length == 20 || data.length == 16) {
                return data;
            }
        }
        let bytes = Utils.openssl_random_pseudo_bytes(20);
        console.log('w>' + bytes.length);
        fs.writeFile(identity_file, urlencode.encode(bytes.toString()), (err) => {
            if (err) throw new Error(`Unable to write identity file to ${identity_file}`);
            return bytes;
        });
    }

    /**
   * Print a message to the debug console.
   *
   * @param  mixed $debugMsg The debug message.
   *
   * @return bool
   */
    debugPrint(debugMsg) {
        if (this.debug) {
            console.debug(JSON.stringify(debugMsg, null, 2));
            return true;
        }
        return false;
    }

    /**
     * @return WhatsApiEventsManager
     */
    get eventManager() {
        return this.eventManager;
    }
}