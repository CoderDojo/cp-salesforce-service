"use strict"
var _ = require('lodash');
var moment = require('moment');
// We create an Account in Salesforce with the champion information and we also create a Lead.
// The user.id is used for both Account and Leads.
function updateProfiles (args, done) {
    var seneca = this;
    var ENTITY_NS = 'cd/profiles';
    var profile = args.profile;
      seneca.make$(ENTITY_NS).load$(profile.id, function (err, res) {
        if (err) return this._salesForceLogger('error', '[error][salesforce] profile id: ' + profile.id + ' not present');

        if (res.userType.toLowerCase() === 'champion') {
          var dobOffset = moment(profile.dob).utcOffset();
          var account = {
            PlatformId__c: profile.userId
          };
          _.extend(account, {
            Name: profile.name,
            Email__c: profile.email,
            DateofBirth__c: moment.utc(profile.dob).add(dobOffset, 'minutes'),
            BillingCountry: profile.country.countryName || null,
            BillingCity: profile.place.nameWithHierarchy || null,
            BillingState: profile.place.admin2Name || null,
            BillingStreet: profile.address || null,
            Phone: profile.phone || null,
            Linkedin__c: profile.linkedin || null,
            Twitter__c: (profile.twitter) ? 'https://twitter.com/' + profile.twitter : null,
            Notes__c: profile.notes || null,
            Projects__c: profile.projects || null,
            ProgrammingLanguages__c: (profile.programmingLanguages) ? profile.programmingLanguages.join(';') : null,
            LanguagesSpoken__c: (profile.languagesSpoken) ? profile.languagesSpoken.join(';') : null
          });

          seneca.act('role:cd-salesforce,cmd:save_account', {userId: profile.userId, account: account, fatal$: false}, function (err, res) {
            if (err) return this._salesForceLogger('error', '[error][salesforce] error saving champion account id: ' + profile.userId);
             this._salesForceLogger('success', '[salesforce] updated champion account id: ' + profile.userId);
             done(err, res);
          });
        }
      });
}

module.exports = updateProfiles;
