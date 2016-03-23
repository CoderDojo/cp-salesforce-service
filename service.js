'use strict';

if (process.env.NEW_RELIC_ENABLED === 'true') require('newrelic');

var config = require('./config/config.js')();
var seneca = require('seneca')(config);

seneca.log.info('using config', JSON.stringify(config, null, 4));
seneca.options(config);

seneca.use('salesforce-store', config.salesforce);
seneca.use('queue');
seneca.use(require('./salesforce.js'), config.salesforce);
seneca.act({ role: 'queue', cmd: 'start' });
seneca.listen();
