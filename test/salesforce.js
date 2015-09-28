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
var dojos = require('.fixtures/dojos.json');

seneca.options(config);

var usersEnt = seneca.make$("sys/user"),
  dojosEnt = seneca.make$("cd/dojos"),
  salesforceUserAccountEnt = seneca.make$('Account');

seneca.use(__dirname + '/../salesforce.js');

// this is unusually necessary
// when interrupted, node doesn't stop without this
process.on('SIGINT', function () {
  process.exit(0);
});

// NOTE: all tests are basic
// they just follow the happy scenario for each exposed action

function save_account(account, userId, done) {
  seneca.act({role: role, cmd: 'save_account', userId: userId, account: account}, function (err, salesforceUserAccount) {
    if (err) return done(err);

    expect(salesforceUserAccount.id).to.be.ok;

    done(null, salesforceUserAccount);
  });
}

function create_dojo(obj, creator, done) {
  seneca.act({role: role, cmd: 'create', dojo: obj, user: {id: creator.id, roles: ['cdf-admin']}},
    function (err, savedDojo) {
      if (err) return done(err);

      expect(savedDojo.id).to.be.ok;

      done(null, savedDojo);
    });
}

lab.experiment('Salesforce Microservice test', function () {

  // Empty Tables
  lab.before(function (done) {
    salesforceUserAccountEnt.remove$({all$: true}, done);
  });

  // Empty Tables
  lab.before(function (done) {
    dojosEnt.remove$({all$: true}, done);
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
    seneca.util.recurse(5, function (index, next) {
      dojos[index].userId = users[index].id;
      create_dojo(dojos[index], users[index], next);
    }, done);
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

          salesforceUserAccountEnt.load$({id: salesforceUserAccount.id}, function (err, loadedSalesforceUserAccount) {
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

      salesforceUserAccountEnt.list$(function (err, salesforceUsersAccounts) {

        expect(salesforceUsersAccounts).not.to.be.empty;
        expect(salesforceUsersAccounts[0].PlatformId__c).to.be.ok;

        seneca.act({ role: role, cmd: 'get_account', platformId: salesforceUsersAccounts[0].PlatformId__c }, function (err, salesforceUserAccount) {
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

      dojosEnt.list$(function (err, dojos) {

        async.eachSeries(dojos, function(dojo){
          var lead = {};
          var userId = dojo.creator;

          seneca.act({ role: role, cmd: 'save_lead', userId: userId, lead: lead}, function (err, salesforceDojoLead) {

          });
        });
      });
    });
  });

});

