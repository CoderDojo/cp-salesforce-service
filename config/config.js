
module.exports = function() {

  return {
    transport: {
      type: 'web',
      web: {
        host: '0.0.0.0',
        port: 10304
      }
    },
    salesforce: {
      loginUrl: process.env.SALESFORCE_URL,
      username: process.env.SALESFORCE_USERNAME,
      password: process.env.SALESFORCE_PASSWORD
    }
  };
}
