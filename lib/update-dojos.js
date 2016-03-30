"use strict"

var _ = require('lodash');
var moment = require('moment');
var slug = require('limax');

// Note at this stage we expect to have an existing Account and Lead types in salesforce, this is
// done at inital champion registration in cp-users.
function updateDojos (args, done) {
  var seneca = this;
  var _salesForceLogger = this._salesForceLogger;

  var ENTITY_NS = 'cd/dojos';
  var DOJO_LEADS_ENTITY_NS = 'cd/dojoleads';
  var dojoObj = args;
  var converted = dojoObj.dojoLead.converted || false;
  var accId  = void 0;
  var authorizedSteps = [2, 3, 4, 5];
  if(_.includes( authorizedSteps, dojoObj.currStep)){
    _getSalesForceAccount(dojoObj.userId, function (err, res) {
      if (err || res.error) return _salesForceLogger('error', err || res.error);
      if(_.isObject(res)){
        accId = res.accId;
        if(accId){
          switch(dojoObj.currStep){
            case 2:
                _updateSalesForceAccount(accId, dojoObj, function (err, res) {
                  if (err || res.error) return _salesForceLogger('error', err || res.error);
                  if (res.success) _salesForceLogger('success', res.success);
                  _updateSalesForceLead(accId, dojoObj, function (err, res) {
                    if (err || res.error) return _salesForceLogger('error', err || res.error);
                    if (res.success) _salesForceLogger('success', res.success);
                  });
                });
              break;

            case 3:
                _updateSalesForceLead(accId, dojoObj, function (err, res) {
                  if (err || res.error) return _salesForceLogger('error', err || res.error);
                  if (res.success) _salesForceLogger('success', res.success);
                });
              break;

            case 4:
                if (converted) {
                  _updateSalesForceAccount(accId, dojoObj, function (err, res) {
                    if (err || res.error) return _salesForceLogger('error', err || res.error);
                    if (res.success) _salesForceLogger('success', res.success);
                  });
                } else {
                  _updateSalesForceLead(accId, dojoObj, function (err, res) {
                    if (err || res.error) return _salesForceLogger('error', err || res.error);
                    if (res.success) _salesForceLogger('success', res.success);
                  });
                }
              break;

            case 5 :
                if (converted) {
                  _updateSalesForceAccount(accId, dojoObj, function (err, res) {
                    if (err || res.error) return _salesForceLogger('error', err || res.error);
                    if (res.success) _salesForceLogger('success', res.success);
                  });
                } else {
                  dojoObj.toBeConverted = true;
                  _updateSalesForceLead(accId, dojoObj, function (err, res) {
                    if (err || res.error) return _salesForceLogger('error', err || res.error);
                    if (res.success) _salesForceLogger('success', res.success);
                  });
                }
              break;
          }
          done(err,res);

        }else {
          done(err, res);
          return _salesForceLogger('error', '[error][salesforce] no salesforce id recieved');
        }
      }else{
        done(err, res);
        return _salesForceLogger('error', '[error][salesforce] Invalid response recieved');
      }
    });
  } else {
    done(err, res);
    return _salesForceLogger('error', '[error][salesforce] problem with current step');
  }

  function _getSalesForceAccount (userId, cb) {
    if (arguments.length !== 2 || typeof cb !== 'function') return _salesForceLogger('error', '[error][salesforce] - missing parameters');

    seneca.act('role:cd-salesforce,cmd:get_account', {platformId: userId}, function (err, res) {
      if (err || !res.accId || res.error) {
        return cb(null, {error: '[error][salesforce] id: ' + userId + ' - ' + err || res.error});
      }
      return cb(null, res);
    });
  }

  function _updateSalesForceLead (accId, dojoObj, cb) {
    if (arguments.length !== 3 || typeof cb !== 'function') return _salesForceLogger('error', '[error][salesforce] - missing parameters');

    if (dojoObj.userId && dojoObj.dojoLead) {
      var action = dojoObj.dojoAction || 'blank';
      var saveLead = {
        PlatformId__c: dojoObj.dojoLead.id
      };
      var convertAccount = dojoObj.toBeConverted || false;
      var converted = dojoObj.dojoLead.converted || false;
      var leadId = dojoObj.dojoLead.id || null;

      if (dojoObj.currStep === 2) {
        if (dojoObj.dojoLead && dojoObj.dojoLead.application && dojoObj.dojoLead.application.championDetails) {
          leadId = dojoObj.userId;
          var championDetails = dojoObj.dojoLead.application.championDetails;
          _.extend(saveLead, {
            PlatformId__c: dojoObj.userId,
            PlatformURL__c: 'https://zen.coderdojo.com/profile/' + dojoObj.userId,
            Company: championDetails.name || '<n/a>',
            LastName: championDetails.name || 'coderdojo user',
            Email: championDetails.email || 'info@coderdojo.com',
            RecordTypeId: process.env.SALESFORCE_LEAD_RECORDTYPEID || null,
            Language__c: 'en_US',
            ChampionAccount__c: accId,
            Status: '2. Champion Registration Completed'
          });
        }
      } else if (dojoObj.currStep === 3) {
        if (dojoObj.dojoLead && dojoObj.dojoLead.application && dojoObj.dojoLead.application.setupYourDojo) {
          leadId = dojoObj.userId;
          var setupDojoObj = dojoObj.dojoLead.application.setupYourDojo;
          _.extend(saveLead, {
            PlatformURL__c: 'https://zen.coderdojo.com/profile/' + dojoObj.userId,
            Company: (dojoObj.dojoLead.application.championDetails && dojoObj.dojoLead.application.championDetails.name) ? dojoObj.dojoLead.application.championDetails.name : '<n/a>',
            LastName: (dojoObj.dojoLead.application.championDetails && dojoObj.dojoLead.application.championDetails.name) ? dojoObj.dojoLead.application.championDetails.name : 'coderdojo user',
            Email: (dojoObj.dojoLead.application.championDetails && dojoObj.dojoLead.application.championDetails.email) ? dojoObj.dojoLead.application.championDetails.email : 'info@coderdojo.com',
            RecordTypeId: process.env.SALESFORCE_LEAD_RECORDTYPEID || null,
            Language__c: 'en_US',
            ChampionAccount__c: accId,
            FindTechnicalMentors__c: setupDojoObj.findTechnicalMentors || false,
            FindNonTechnicalMentors__c: setupDojoObj.findNonTechnicalMentors || false,
            BackgroundCheckSetUp__c: setupDojoObj.backgroundCheck || false,
            BackgroundCheckComment__c: setupDojoObj.backgroundCheckText || null,
            LocateVenue__c: setupDojoObj.locateVenue || false,
            HealthAndSafetyMet__c: setupDojoObj.ensureHealthAndSafety || false,
            HealthAndSafetyComment__c: setupDojoObj.ensureHealthAndSafetyText || null,
            Insurance__c: setupDojoObj.ensureInsuranceCover || false,
            InsuranceComment__c: setupDojoObj.ensureInsuranceCoverText || null,
            LaunchDateAndTime__c: setupDojoObj.setDojoDateAndTime || false,
            ContentPlan__c: setupDojoObj.planContent || false,
            TicketingSetUp__c: setupDojoObj.setupTicketingAndRegistration || false,
            SetUpEmail__c: setupDojoObj.setDojoEmailAddress || false,
            SetUpSocialMedia__c: setupDojoObj.setupSocialMedia || false,
            ConnectWithOtherDojos__c: setupDojoObj.connectOtherDojos || false,
            EmbodyCoderDojoTao__c: setupDojoObj.embodyCoderDojoTao || false,
            OnlineSafetyBestPractice__c: setupDojoObj.onlineSafetyBestPractice || false,
            OnlineSafetyComments__c: setupDojoObj.onlineSafetyBestPracticeText || null,
            DataProtectionRegulated__c: setupDojoObj.dataProtectionRegulated || false,
            DataProtectionComments__c: setupDojoObj.dataProtectionRegulatedText || null,
            DiversityRespected__c: setupDojoObj.diversityRespected || false,
            DiversityRespectedComments__c: setupDojoObj.diversityRespectedText || null,
            EngageCoderDojoMovement__c: setupDojoObj.engageCoderDojoMovement || false,
            EngageCoderDojoMovementComments__c: setupDojoObj.engageCoderDojoMovementText || null,
            Status: '4. Dojo Set Up Completed'
          });
        }
      } else if (action !== 'delete' && (dojoObj.currStep === 4 || dojoObj.currStep === 5)) {
        if (dojoObj.dojoLead && dojoObj.dojoLead.application && dojoObj.dojoLead.application.dojoListing) {
          var dojoListing = dojoObj.dojoLead.application.dojoListing;
          _.extend(saveLead, {
            PlatformURL__c: 'https://zen.coderdojo.com/dojo/' + _createUrlSlug(dojoListing.alpha2, dojoListing.admin1Name, dojoListing.placeName, dojoListing.name),
            Company: dojoListing.name || '<n/a>',
            LastName: (dojoObj.dojoLead.application.championDetails && dojoObj.dojoLead.application.championDetails.name) ? dojoObj.dojoLead.application.championDetails.name : 'coderdojo user',
            Email__c: dojoListing.email || _getCoderDojoEmail(dojoListing.alpha2, dojoListing.admin1Name, dojoListing.placeName, dojoListing.name),
            Time__c: dojoListing.time || null,
            Country: dojoListing.country.countryName || null,
            City: dojoListing.place.nameWithHierarchy || null,
            State: dojoListing.place.admin2Name || null,
            Street: dojoListing.address1 || null,
            Coordinates__Latitude__s: (dojoListing.coordinates) ? dojoListing.coordinates.split(',')[0] : null,
            Coordinates__Longitude__s: (dojoListing.coordinates) ? dojoListing.coordinates.split(',')[1] : null,
            Notes__c: dojoListing.notes || null,
            NeedMentors__c: (dojoListing.hasOwnProperty('needMentors')) ? parseInt(dojoListing.needMentors, 10) : false,
            Stage__c: _getSalesforceStageText(dojoListing.stage),
            Private__c: (dojoListing.hasOwnProperty('private')) ? parseInt(dojoListing.private, 10) : false,
            GoogleGroupURL__c: dojoListing.googleGroup || null,
            Website: dojoListing.website || null,
            Twitter__c: (dojoListing.twitter) ? 'https://twitter.com/' + dojoListing.twitter : null,
            SupportersImageURL__c: dojoListing.supporterImage || null,
            MailingList__c: (dojoListing.hasOwnProperty('mailingList')) ? parseInt(dojoListing.mailingList, 10) : false,
            Status: '5. Dojo Listing Created'
          });
        }
      } else if (dojoObj.currStep === 5 && action === 'verify') {
        _.extend(saveLead, {Status: '7. Dojo Listing Verified'});
      } else if (action === 'delete' && (dojoObj.currStep === 4 || dojoObj.currStep === 5)) {
        _.extend(saveLead, {Deleted__c: true});
      } else {
        return cb(null, {error: '[error][salesforce] lead problem with dojo current step'});
      }

      if (converted !== true) {
        seneca.act('role:cd-salesforce,cmd:save_lead', {leadId: leadId, lead: saveLead}, function (err, res) {
          if (err || !res) return cb(null, {error: '[error][salesforce] id: ' + leadId + ' - lead NOT saved'});

          if (convertAccount === true) {
            var dojoLeadId = res.id$;
            seneca.act('role:cd-salesforce,cmd:convert_lead_to_account', {leadId: dojoLeadId}, function (err, res) {
              if (err) return cb(null, {error: '[error][salesforce] id: ' + dojoLeadId + ' - lead NOT converted'});
              _salesForceLogger('success', '[salesforce] id: ' + dojoLeadId + ' - lead converted to account');

              seneca.act({role: plugin, cmd: 'load_dojo_lead', id: leadId}, function (err, res) {
                if (err || !res) return cb(null, {error: '[error] id: ' + leadId + ' - dojo lead NOT loaded'});
                var dojoLead = res;
                dojoLead.converted = true;
                var dojoLeadEntity = seneca.make$(DOJO_LEADS_ENTITY_NS);
                dojoLeadEntity.save$(dojoLead, function (err, res) {
                  if (err || !res) return cb(null, {error: '[error] id: ' + dojoLeadId + ' - dojo lead \'converted\' field NOT saved'});
                  return cb(null, {success: 'id: ' + dojoLeadId + ' - dojo lead \'converted\' field saved'});
                });
              });
            });
          } else {
            return cb(null, {success: '[salesforce] id: ' + leadId + ' - lead saved'});
          }
        });
      }
    } else {
      return cb(null, {error: '[error][salesforce] no userId'});
    }
  }

  function _updateSalesForceAccount (accId, dojoObj, cb) {
    if (arguments.length !== 3 || typeof cb !== 'function') return _salesForceLogger('error', '[error][salesforce] - missing parameters');

    if (dojoObj.userId) {
      var action = dojoObj.dojoAction || 'blank';

      var saveAccount = {PlatformId__c: dojoObj.userId};
      if (dojoObj.currStep === 2) {
        if (dojoObj.dojoLead && dojoObj.dojoLead.application && dojoObj.dojoLead.application.championDetails) {
          var championDetails = dojoObj.dojoLead.application.championDetails;
          var dobOffset = (championDetails.dateOfBirth) ? moment(championDetails.dateOfBirth).utcOffset() : 0;
          _.extend(saveAccount, {
            Email__c: championDetails.email || 'info@codedojo.org',
            Name: championDetails.name || null,
            DateofBirth__c: (championDetails.dateOfBirth) ? moment.utc(championDetails.dateOfBirth).add(dobOffset, 'minutes') : null,
            Phone: championDetails.phone || '00000000',
            BillingCountry: championDetails.country.countryName || null,
            BillingCity: championDetails.place.nameWithHierarchy || null,
            BillingState: championDetails.place.admin2Name || null,
            BillingStreet: championDetails.address1 || null,
            Coordinates__Latitude__s: (championDetails.coordinates) ? championDetails.coordinates.split(',')[0] : null,
            Coordinates__Longitude__s: (championDetails.coordinates) ? championDetails.coordinates.split(',')[1] : null,
            Projects__c: championDetails.projects || null,
            ExperienceWorkingWithYouth__c: championDetails.youthExperience || null,
            Twitter__c: (championDetails.twitter) ? 'https://twitter.com/' + championDetails.twitter : null,
            Linkedin__c: championDetails.linkedIn || null,
            Notes__c: championDetails.notes || null,
            CoderDojoReferral__c: championDetails.coderDojoReference || null,
            CoderDojoReferralComment__c: (championDetails.CoderDojoReferralComment__c === 'Other') ? championDetails.coderDojoReferenceOther : ''
          });
        }
      } else if (dojoObj.currStep === 4 && action === 'verify') {
        _.extend(saveAccount, {
          PlatformId__c: dojoObj.dojoLead.id,
          Verified__c: false
        });
      } else if (dojoObj.currStep === 5 && action === 'verify') {
        _.extend(saveAccount, {
          PlatformId__c: dojoObj.dojoLead.id,
          Verified__c: true
        });
      } else if (action === 'delete' && (dojoObj.currStep === 4 || dojoObj.currStep === 5)) {
        _.extend(saveAccount, {
          PlatformId__c: dojoObj.dojoLead.id,
          Deleted__c: 1
        });
      } else if (action === 'update' && dojoObj.currStep === 5) {
        if (dojoObj.dojoLead && dojoObj.dojoLead.application && dojoObj.dojoLead.application.dojoListing) {
          var dojoListing = dojoObj.dojoLead.application.dojoListing;
          _.extend(saveAccount, {
            Name: dojoListing.name || null,
            Email__c: dojoListing.email || 'info@codedojo.org',
            Time__c: dojoListing.time || null,
            BillingCountry: dojoListing.country.countryName || null,
            BillingCity: dojoListing.place.nameWithHierarchy || null,
            BillingState: dojoListing.place.admin2Name || null,
            BillingStreet: dojoListing.address1 || null,
            Coordinates__Latitude__s: (dojoListing.coordinates) ? dojoListing.coordinates.split(',')[0] : null,
            Coordinates__Longitude__s: (dojoListing.coordinates) ? dojoListing.coordinates.split(',')[1] : null,
            Notes__c: dojoListing.notes || null,
            NeedMentors__c: (dojoListing.hasOwnProperty('needMentors')) ? parseInt(dojoListing.needMentors, 10) : false,
            Stage__c: _getSalesforceStageText(dojoListing.stage),
            Private__c: (dojoListing.hasOwnProperty('private')) ? parseInt(dojoListing.private, 10) : false,
            GoogleGroupURL__c: dojoListing.googleGroup || null,
            Website: dojoListing.website || null,
            Twitter__c: (dojoListing.twitter) ? 'https://twitter.com/' + dojoListing.twitter : null,
            SupportersImageURL__c: dojoListing.supporterImage || null,
            MailingList__c: (dojoListing.hasOwnProperty('mailingList')) ? parseInt(dojoListing.mailingList, 10) : false
          });
        }
      } else {
        return cb(null, {error: '[error][salesforce] account problem with dojo current step'});
      }

      seneca.act('role:cd-salesforce,cmd:save_account', {
        userId: saveAccount.PlatformId__c,
        account: saveAccount
      }, function (err, res) {
        if (err || !res) {
          return cb(null, {error: '[error][salesforce] id: ' + saveAccount.PlatformId__c + ' - account NOT saved'});
        }
        return cb(null, {success: '[salesforce] id: ' + saveAccount.PlatformId__c + ' - account saved'});
      });
    } else {
      return cb(null, {error: '[error][salesforce] no id present'});
    }
  }

  function _getSalesforceStageText (stage) {
    switch (parseInt(stage, 10)) {
      case 0:
        return 'In Planning';
      case 1:
        return 'Active - Just show up';
      case 2:
        return 'Register Ahead';
      case 3:
        return 'Dojo full sorry';
      case 4:
        return 'Inactive';
      default:
        return 'unknown';
    }
  }

  function _getCoderDojoEmail (dojoAlpha2, dojoAdmin1Name, dojoPlaceName, dojoName) {
    var urlSlug = _createUrlSlug(dojoAlpha2, dojoAdmin1Name, dojoPlaceName, dojoName);
    var email = _.last(urlSlug.split('/')).concat('.', dojoAlpha2.toLowerCase(), '@coderdojo.com');
    if (process.env.ENVIRONMENT === 'development') {
      email = 'dev-' + email;
    }

    return email;
  }

  function _createUrlSlug (dojoAlpha2, dojoAdmin1Name, dojoPlaceName, dojoName) {
    var slugify = function (name) {
      return slug(name);
    };
    return _.chain([dojoAlpha2, dojoAdmin1Name, dojoPlaceName, dojoName]).compact().map(slugify).value().join('/').toLowerCase();
  }


}



module.exports = updateDojos;
