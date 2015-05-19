var util = require('util');

var seneca = require('seneca')().client({
  port: 10304,
  pin: 'role:cd-salesforce,cmd:*'
});

function print(err, result) {
  if (err) { return console.error(err); }
  console.log(util.inspect(result, true, null))
}

seneca.act('role:cd-salesforce, cmd:list_leads', {}, print);
