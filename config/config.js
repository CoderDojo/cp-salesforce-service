var assert = require('assert');
var LogEntries = require('le_node');

module.exports = function() {
  function log () {
    // seneca custom log handlers
    function debugHandler() {
      if (process.env.LOGENTRIES_ENABLED === 'true') {
        assert.ok(process.env.LOGENTRIES_DEBUG_TOKEN, 'No LOGENTRIES_DEBUG_TOKEN set');
        var le = new LogEntries({
          token: process.env.LOGENTRIES_DEBUG_TOKEN,
          flatten: true,
          flattenArrays: true
        });

        le.log('debug', arguments);
      }
    }

    function errorHandler() {
      console.error(JSON.stringify(arguments));

      if (process.env.LOGENTRIES_ENABLED === 'true') {
        assert.ok(process.env.LOGENTRIES_ERRORS_TOKEN, 'No LOGENTRIES_ERROR_TOKEN set');
        var le = new LogEntries({
          token: process.env.LOGENTRIES_ERRORS_TOKEN,
          flatten: true,
          flattenArrays: true
        });

        le.log('err', arguments);
      }
    }

    return {
      map:[{
        level:'debug', handler: debugHandler
      }, {
        level:'error', handler: errorHandler
      }]
    };
  };

  return {
    transport: {
      type: 'web',
      web: {
        port: 10304
      }
    },
    salesforce: {
      loginUrl: process.env.SALESFORCE_URL,
      username: process.env.SALESFORCE_USERNAME,
      password: process.env.SALESFORCE_PASSWORD
    },
    strict: {add:false,  result:false},
    log: log()
  };
}
