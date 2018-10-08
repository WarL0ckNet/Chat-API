'use strict';

const WhatsApiEventsManager = require('./events/whatsApiEventsManager'),
    Constants = require('./constants'),
    Token = require('./token'),
    Utils = require('./utils'),
    crypto = require('crypto'),
    path = require('path'),
    qs = require('querystring'),
    fs = require('fs');

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
            //'rchash' : hash('sha256', openssl_random_pseudo_bytes(20)),
            //'anhash' : md5(openssl_random_pseudo_bytes(20)),
            extexist: '1',
            extstate: '1'
        };
        this.debugPrint(query);
        let response = this.getResponse(host, query);
        this.debugPrint(response);

        if (response.status != 'ok') {
            this.eventManager.fire('onCredentialsBad',
                [
                    this.phoneNumber,
                    response.status,
                    response.reason,
                ]);
            throw new Error('There was a problem trying to request the code.');
        } else {
            this.eventManager.fire('onCredentialsGood',
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
        code = code.replace(/-/g, '');
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
            rchash: crypto.createHash('sha256').update(crypto.randomBytes(20)).digest('base64'),
            anhash: crypto.createHash('md5').update(crypto.randomBytes(20)).digest('hex'),
            extexist: '1',
            extstate: '1',
            code: code,
        };
        this.debugPrint(query);
        response = this.getResponse(host, query);
        this.debugPrint(response);

        if (response.status != 'ok') {
            this.eventManager.fire('onCodeRegisterFailed',
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
            this.eventManager.fire('onCodeRegister',
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
   * Request a registration code from WhatsApp.
   *
   * @param string $method Accepts only 'sms' or 'voice' as a value.
   * @param string $carrier
   *
   * @throws Exception
   *
   * @return object
   *   An object with server response.
   *   - status: Status of the request (sent/fail).
   *   - length: Registration code lenght.
   *   - method: Used method.
   *   - reason: Reason of the status (e.g. too_recent/missing_param/bad_param).
   *   - param: The missing_param/bad_param.
   *   - retry_after: Waiting time before requesting a new code.
   */
    codeRequest(method = 'sms', carrier = 'MTS', platform = 'Android') {
        let phone = this.dissectPhone();
        if (!phone) {
            throw new Error('The provided phone number is not valid.');
        }
        let countryCode = (phone.ISO3166 != '' ? phone.ISO3166 : 'US'),
            langCode = (phone.ISO639 != '' ? phone.ISO639 : 'en'),
            mnc;
        if (carrier != null) {
            mnc = this.detectMnc(countryCode.toLowerCase(), carrier);
        } else {
            mnc = phone.mnc;
        }
        // Build the token.
        let token = Token.generateRequestToken(phone.country, phone.phone, platform);
        // Build the url.
        let host = `https://${Constants.WHATSAPP_REQUEST_HOST}`;
        let query = {
            cc: phone.cc,
            in: phone.phone,
            lg: langCode,
            lc: countryCode,
            id: this.identity.toString(),
            token: token,
            mistyped: '6',
            network_radio_type: '1',
            simnum: '1',
            s: '',
            copiedrc: '1',
            hasinrc: '1',
            rcmatch: '1',
            pid: 100 + Math.floor(9900 * Math.random()),
            rchash: crypto.createHash('sha256').update(crypto.randomBytes(20)).digest('base64'),
            anhash: crypto.createHash('md5').update(crypto.randomBytes(20)).digest('hex'),
            extexist: '1',
            extstate: '1',
            mcc: phone.mcc,
            mnc: mnc,
            sim_mcc: phone.mcc,
            sim_mnc: mnc,
            method: method
            //reason : "self-send-jailbroken",
        };
        this.debugPrint(query);
        let response = this.getResponse(host, query);
        this.debugPrint(response);
        if (response.status == 'ok') {
            this.eventManager.fire('onCodeRegister',
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
        } else if (response.status != 'sent') {
            if (response.reason && response.reason == 'too_recent') {
                this.eventManager.fire('onCodeRequestFailedTooRecent',
                    [
                        this.phoneNumber,
                        method,
                        response.reason,
                        response.retry_after
                    ]);
                let minutes = Math.round(response.retry_after / 60);
                throw new Error(`Code already sent. Retry after ${minutes} minutes.`);
            } else if (response.reason && response.reason == 'too_many_guesses') {
                this.eventManager.fire('onCodeRequestFailedTooManyGuesses',
                    [
                        this.phoneNumber,
                        method,
                        response.reason,
                        response.retry_after
                    ]);
                let minutes = Math.round(response.retry_after / 60);
                throw new Error(`Too many guesses. Retry after ${minutes} minutes.`);
            } else {
                this.eventManager.fire('onCodeRequestFailed',
                    [
                        this.phoneNumber,
                        method,
                        response.reason,
                        (response.param ? response.param : null)
                    ]);
                throw new Error('There was a problem trying to request the code.');
            }
        } else {
            this.eventManager.fire('onCodeRequest',
                [
                    this.phoneNumber,
                    method,
                    response.length,
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
        const https = require('https'),
            url = `${host}?${qs.stringify(query, null, null, { decodeURIComponent: null })}`;
        let options = {
            headers: {
                'User-Agent': Constants.WHATSAPP_USER_AGENT,
                'Accept': 'text/json'
            }
        };
        console.log(url);
        let req = https.get(host, options, (res) => {
            let response;
            console.log('res');
            res.on('data', (chunk) => {
                console.log('data>' + chunk);
                response += chunk;
            });
            res.on('end', () => {
                return JSON.parse(response);
            });
        });
        req.end();
        req.on('error', (err) => {
            console.error(err);
        });
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
        let contents = fs.readFileSync(`${__dirname}${path.sep}countries.csv`);
        let lines = contents.toString().split(/\n/);
        for (let i in lines) {
            let data = lines[i].replace(/"/g, '').split(/,/);
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
                this.eventManager.fire('onDissectPhone',
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
        }
        this.eventManager.fire('onDissectPhoneFailed',
            [
                this.phoneNumber,
            ]);
        return false;
    }

    /**
    * Detects mnc from specified carrier.
    *
    * @param string $lc          LangCode
    * @param string $carrierName Name of the carrier
    *
    * @return string
    *
    * Returns mnc value
    */
    detectMnc(lc, carrierName) {
        let contents = fs.readFileSync(`${__dirname}${path.sep}networkinfo.csv`);
        let lines = contents.toString().split(/\n/);
        let mnc = null;
        for (let i in lines) {
            let data = lines[i].replace(/"/g, '').split(/,/);
            if (data[4] === lc && data[7] === carrierName) {
                mnc = data[2];
                break;
            }
        }
        if (!mnc) {
            mnc = '000';
        }
        return mnc;
    }

    update() {
        const https = require('https');
        https.get(Constants.WHATSAPP_VER_CHECKER, (res) => {
            res.on('data', (d) => {
                let WAData = JSON.parse(d.toString());
                if (Constants.WHATSAPP_VER != WAData.d) {
                    console.log(`Update token.js: ${WAData.a}`);
                    console.log(`Update constants.js: ${WAData.d}`);
                }
            });
        }).on('error', (e) => {
            console.error(e);
        });
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
        let data;
        if (!identity_file) {
            identity_file = `${__dirname}${path.sep}${Constants.DATA_FOLDER}${path.sep}id.${this.phoneNumber}.dat`;
        }
        // Check if the provided is not a file but a directory
        if (fs.existsSync(identity_file)) {
            if (fs.lstatSync(identity_file).isDirectory()) {
                identity_file = `${Utils.rtrim(identity_file, path.sep)}${path.sep}id.${this.phoneNumber}.dat`;
            }
            data = qs.unescape(fs.readFileSync(identity_file));
            if (data.length == 20 || data.length == 16) {
                return data;
            }
        }
        data = crypto.randomBytes(20);
        try {
            fs.writeFileSync(identity_file, qs.escape(data));
            return data;
        } catch (err) {
            throw new Error(`Unable to write identity file to ${identity_file}`);
        }
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
}