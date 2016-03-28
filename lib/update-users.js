"use strict"

// We create an Account in Salesforce with the champion information and we also create a Lead.
// The user.id is used for both Account and Leads.
function updateUsers (args, done) {
    var seneca = this;
    if (process.env.SALESFORCE_ENABLED !== 'true') return;
    
    var user = args.user;
    var account = {
      PlatformId__c: user.id,
      PlatformUrl__c: 'https://zen.coderdojo.com/dashboard/profile/' + user.id,
      Email__c: user.email,
      Name: user.name,
      UserType__c: 'Champion',
      RecordTypeId: process.env.SALESFORCE_ACC_RECORDTYPEID
    };

    seneca.act('role:cd-salesforce,cmd:save_account', {userId: user.id, account: account}, function (err, res) {
      if (err) return seneca.log.error('Error creating Account in SalesForce!', err);
      seneca.log.info('Created Account in SalesForce', account, res);
      done(err, res);
    });
}

module.exports = updateUsers;
