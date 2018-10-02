'use strict';

module.exports = class WhatsApiEventsManager {
    constructor() {
        this.listeners = {};
    }
    bind(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        if (typeof callback == 'function') {
            this.listeners[event].push(callback);
        }
    }
    fire(event, parameters) {
        if (this.listeners[event]) {
            for (let i in this.listeners[event]) {
                if (typeof this.listeners[event][i] == 'function') {
                    return (this.listeners[event][i])(...parameters);
                }
            }
        }
    }
}