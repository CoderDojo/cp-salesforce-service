module.exports = function () {
  return {
    transport: {
      type: 'web',
      web: {
        timeout: 120000,
        port: 10304
      }
    },
    salesforce: {
      loginUrl: process.env.SALESFORCE_URL,
      username: process.env.SALESFORCE_USERNAME,
      password: process.env.SALESFORCE_PASSWORD
    },
    strict: {add: false, result: false},
    actcache: {active: false}
  };
};
