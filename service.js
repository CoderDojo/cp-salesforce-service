'use strict';

if (process.env.NEW_RELIC_ENABLED === 'true') require('newrelic');

var config = require('./config/config.js')();
var util = require('util');
var _ = require('lodash');
var seneca = require('seneca')(config);

seneca.log.info('using config', JSON.stringify(config, null, 4));
seneca.options(config);

// As it's an memory-based queue, we may loose some sync w/ salesforce
// TODO : use sqs
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', shutdown);

function shutdown (err) {
  seneca.act({ role: 'queue', cmd: 'stop' });
  if (err !== void 0 && err.stack !== void 0) {
    console.error(new Date().toString() + ' FATAL: UncaughtException, please report: ' + util.inspect(err));
    console.error(util.inspect(err.stack));
    console.trace();
  }
  process.exit(0);
}

seneca.use('salesforce-store', config.salesforce);
seneca.use('queue');
seneca.use(require('./salesforce.js'), _.extend(config.salesforce, {timeout: config.timeout}));
seneca.act({ role: 'queue', cmd: 'start' });
seneca.listen();
