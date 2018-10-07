'use strict';
const fs = require('fs'),
    path = require('path');
const csv = require('csvtojson');
csv({
    noheader: true,
    trim: true,
})
    .fromFile(`${__dirname}${path.sep}src${path.sep}countries.csv`)
    .then((jsonObj) => {
        console.log(jsonObj);
    });

