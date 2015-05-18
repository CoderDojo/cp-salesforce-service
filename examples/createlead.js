var util = require('util');

var seneca = require('seneca')().client({
  port: 10304,
  pin: 'role:cd-salesforce,cmd:*'
});

function print(err, result) {
  if (err) { return console.error(err); }
  console.log(util.inspect(result).replace(/\n/g,' '));
}

var args = {
  application: {
    championDetails: {
      email: 'cptestlead@example.com',
      name: 'CP test lead',
      country: {},
      countryName: 'Afghanistan',
      continent: 'AS',
      alpha2: 'AF',
      alpha3: 'AFG',
      phone: '454356' }
  },
  userId: '31a7b56f-23ac-4bae-854c-9872e7ed3cae',
  email: 'cptestlead@example.com',
  currentStep: 2
};
seneca.act('role:cd-dojos, cmd:save_dojo_lead', {dojoLead: args}, print);
