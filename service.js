'use strict';

var config = require('./config/config.js')();
var seneca = require('seneca')();

seneca.log.info('using config', JSON.stringify(config, null, 4));

seneca.options(config);

seneca.use('salesforce-store', config.salesforce);
seneca.use(require('./salesforce.js'));

seneca.listen();
