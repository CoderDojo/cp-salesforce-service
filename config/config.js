
module.exports = function() {

  // Utility function for local development running with boot2docker
  // where we need the ip address of boot2docker instead of localhost.
  // This is for accessing containerised services.
  function localhost() {
    if (process.env.DOCKER_HOST) {
      return require('url').parse(process.env.DOCKER_HOST).hostname;
    }
    if (process.env.TARGETIP) {
      return process.env.TARGETIP;
    }
    return '127.0.0.1';
  };

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
