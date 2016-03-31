'use strict';

if (process.env.NEW_RELIC_ENABLED === 'true') require('newrelic');

var config = require('./config/config.js')();
var seneca = require('seneca')(config);

seneca.log.info('using config', JSON.stringify(config, null, 4));
seneca.options(config);

// As it's an memory-based queue, we may loose some sync w/ salesforce
// TODO : use sqs
process.on('SIGINT', function () {
  seneca.act({ role: 'queue', cmd: 'stop' });
  process.exit(0);
});
process.on('SIGTERM', function () {
  seneca.act({ role: 'queue', cmd: 'stop' });
  process.exit(0);
});

seneca.use('salesforce-store', config.salesforce);
seneca.use('queue');
seneca.use(require('./salesforce.js'), config.salesforce);
seneca.act({ role: 'queue', cmd: 'start' });
seneca.listen();
