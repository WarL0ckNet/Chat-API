'use strict';

const WhatsApiEventsManager = require('./src/events/whatsApiEventsManager');

let w = new WhatsApiEventsManager();

let add = (a, b) => {
    return a + b;
}

w.bind('add', add);
console.log(w.fire('add', [2, 3]));