'use strict';

module.exports = class Registration {
    constructor(username, debug) {
        this.username = username;
        this.debug = debug;
    }
    get userName() {
        return this.username;
    }
}