var util = require('util');

var seneca = require('seneca')().client({
  port: 10304,
  pin: 'role:cd-salesforce,cmd:*'
});

function print(err, result) {
  if (err) { return console.error(err); }
  console.log(util.inspect(result));
}

var lead = {
  PlatformId__c: '31a7b56f-23ac-4bae-854c-9872e7ed3cae',
  PlatformUrl__c: 'http://localhost:8000/users/' +  '31a7b56f-23ac-4bae-854c-9872e7ed3cae',
  email: 'cptestlead@example.com',
  Company: 'CreateLead Test Company',
  LastName: 'CreateLead 2'
};

seneca.act('role:cd-salesforce, cmd:save_lead', {userId: '31a7b56f-23ac-4bae-854c-9872e7ed3cae', lead: lead}, print);
