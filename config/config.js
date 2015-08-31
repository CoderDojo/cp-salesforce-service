var assert = require('assert');
var LogEntries = require('le_node');

module.exports = function() {
  function log () {
    // seneca custom log handlers
  
    if (process.env.LOGENTRIES_ENABLED === 'true') {
      assert.ok(process.env.LOGENTRIES_DEBUG_TOKEN, 'No LOGENTRIES_DEBUG_TOKEN set');
      var led = new LogEntries({
        token: process.env.LOGENTRIES_DEBUG_TOKEN,
        flatten: true,
        flattenArrays: true
      });
      
      assert.ok(process.env.LOGENTRIES_ERRORS_TOKEN, 'No LOGENTRIES_ERROR_TOKEN set');
      var lee = new LogEntries({
        token: process.env.LOGENTRIES_ERRORS_TOKEN,
        flatten: true,
        flattenArrays: true
      });
    }
  
    function debugHandler() {
      if (process.env.LOGENTRIES_ENABLED === 'true') {
        assert.ok(process.env.LOGENTRIES_DEBUG_TOKEN, 'No LOGENTRIES_DEBUG_TOKEN set');
        led.log('debug', arguments);
      }
    }
  
    function errorHandler() {
      console.error(JSON.stringify(arguments));
  
      if (process.env.LOGENTRIES_ENABLED === 'true') {
        assert.ok(process.env.LOGENTRIES_ERRORS_TOKEN, 'No LOGENTRIES_ERROR_TOKEN set');
        lee.log('err', arguments);
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
      type: 'tcp',
      tcp: {
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
