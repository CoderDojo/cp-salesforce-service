'use strict';

process.env.SALESFORCE_ENABLED = 'true';

var seneca = require('seneca')(),
  config = require(__dirname + '/../config/config.js')(),
  fs = require('fs'),
  expect = require('chai').expect,
  util = require('util'),
  _ = require('lodash'),
  async = require('async'),
  sinon = require('sinon'),
  lab = exports.lab = require('lab').script();

var role = "cd-salesforce";

var users = require('./fixtures/users.json');
var salesforceUsers = require('./fixtures/salesforceUsers.json');
var dojos = require('./fixtures/salesforceDojos.json');

seneca.options(config);

var usersEnt = seneca.make$("sys/user"),
  salesforceAccountEnt = seneca.make$('Account'),
  salesforceLeadEnt = seneca.make$('Lead');

seneca.use(__dirname + '/../salesforce.js');

// this is unusually necessary
// when interrupted, node doesn't stop without this
process.on('SIGINT', function () {
  process.exit(0);
});

// NOTE: all tests are basic
// they just follow the happy scenario for each exposed action

function save_account(account, userId, done) {
  seneca.act({
    role: role,
    cmd: 'save_account',
    userId: userId,
    account: account
  }, function (err, salesforceUserAccount) {
    if (err) return done(err);

    expect(salesforceUserAccount.id).to.be.ok;

    done(null, salesforceUserAccount);
  });
}

lab.experiment('Salesforce Microservice test', function () {

  // Empty Tables
  lab.before(function (done) {
    salesforceAccountEnt.remove$({all$: true}, done);
  });

  // Empty Tables
  lab.before(function (done) {
    salesforceLeadEnt.remove$({all$: true}, done);
  });

  lab.before(function (done) {
    usersEnt.remove$({all$: true}, done);
  });

  var loadUsers = function (user, cb) {
    usersEnt.save$(user, cb);
  };

  lab.before(function (done) {
    async.eachSeries(users, loadUsers, done);
  });

  lab.before(function (done) {
    seneca.util.recurse(4, function (index, next) {
      save_account(salesforceUsers[index], salesforceUsers[index].PlatformId__c, next);
    }, done);
  });

  lab.experiment('Save SalesForce user account', function () {
    lab.test('save user account to salesforce', function (done) {

      save_account(salesforceUsers[4], salesforceUsers[4].PlatformId__c,
        function (err, salesforceUserAccount) {
          if (err) return done(err);

          salesforceAccountEnt.load$({id: salesforceUserAccount.id}, function (err, loadedSalesforceUserAccount) {
            if (err) return done(err);
            expect(salesforceUsers).not.to.be.empty;

            expect(loadedSalesforceUserAccount).to.exist;
            expect(loadedSalesforceUserAccount).to.be.ok;

            var expectedFields = ['PlatformId__c', 'Name', 'Email__c', 'id'];
            var actualFields = Object.keys(loadedSalesforceUserAccount);
            _.each(expectedFields, function (field) {
              expect(actualFields).to.include(field);
            });

            done();
          });

        });
    });
  });

  lab.experiment('Get SalesForce user account', function () {
    lab.test('get user account to salesforce', function (done) {

      salesforceAccountEnt.list$(function (err, salesforceUsersAccounts) {

        expect(salesforceUsersAccounts).not.to.be.empty;
        expect(salesforceUsersAccounts[0].PlatformId__c).to.be.ok;

        seneca.act({
          role: role,
          cmd: 'get_account',
          platformId: salesforceUsersAccounts[0].PlatformId__c
        }, function (err, salesforceUserAccount) {
          if (err) return done(err);
          expect(salesforceUsers).not.to.be.empty;

          expect(salesforceUserAccount).to.exist;
          expect(salesforceUserAccount).to.be.ok;

          expect(salesforceUserAccount.accId).to.equal(salesforceUsersAccounts[0].id);

          var expectedFields = ['accId'];
          var actualFields = Object.keys(salesforceUserAccount);
          _.each(expectedFields, function (field) {
            expect(actualFields).to.include(field);
          });

          done();
        });
      });
    });
  });

  lab.experiment('Save SalesForce dojo', function () {
    lab.test('Save all dojos to salesforce as salesforce leads(unverified dojo)', function (done) {

      var iterator = 0;
      async.eachSeries(dojos, function(dojo, callback){
        var userId = users[iterator].id;
        seneca.act({role: role, cmd: 'save_lead', userId: userId, lead: dojo}, function (err, salesforceDojoLead) {

          if (err) return callback(err);

          expect(salesforceDojoLead).to.exist;
          expect(salesforceDojoLead).to.be.ok;

          var expectedFields = ['PlatformId__c','Email__c', 'Time__c', 'Country', 'City', 'State', 'Street', 'Coordinates__Latitude__s',
          'Coordinates__Longitude__s', 'Notes__c', 'NeedMentors__c', 'Private__c', 'Website', 'Twitter__c', 'MailingList__c', 'Status'];

          var actualFields = Object.keys(salesforceDojoLead);
          _.each(expectedFields, function (field) {
            expect(actualFields).to.include(field);
          });

          iterator++;
          callback();
        });
      }, done);
    });
  });

  lab.experiment('List Salesforce lead', function () {
    lab.test('list all dojos (Leads) from salesforce(unverified dojo)', function (done) {
      seneca.act({role: role, cmd: 'list_leads'}, function (err, leads) {
        if (err) return callback(err);

        expect(leads).to.exist;
        expect(leads).to.be.ok;

        expect(leads.length).to.equal(5);

        done();
      });
    });
  });
/*
  lab.experiment('Convert Salesforce Lead to account', function () {
    lab.test('Convert Salesforce Lead to account', function (done) {
      seneca.act({role: role, cmd: 'list_leads'}, function (err, leads) {
        if (err) return done(err);

        expect(leads).to.exist;
        expect(leads).to.be.ok;

        expect(leads.length).to.equal(5);

        async.eachSeries(leads, function(lead, callback){
          seneca.act({role: role, cmd: 'convert_lead_to_account', leadId: lead.id}, function (err, account) {
          });
        }, done)
      });
    });
  })*/
});

