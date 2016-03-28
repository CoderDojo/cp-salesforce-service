'use strict';

var updateUsers = require('./lib/update-users');
var updateProfiles = require('./lib/update-profiles');
var updateDojos = require('./lib/update-dojos');
var _ = require('lodash');

module.exports = function (opts) {
  var seneca = this;
  var plugin = 'cd-salesforce';
  seneca.add({role: plugin, cmd: 'list_leads'}, cmd_list_leads);
  seneca.add({role: plugin, cmd: 'save_lead'}, cmd_save_lead);
  seneca.add({role: plugin, cmd: 'convert_lead_to_account'}, cmd_convert_lead_to_account);
  seneca.add({role: plugin, cmd: 'save_account'}, cmd_save_account);
  seneca.add({role: plugin, cmd: 'get_account'}, cmd_get_account);
  seneca.add({role: plugin, cmd: 'queud_update_users'}, _wrapQueue('update_users'));
  seneca.add({role: plugin, cmd: 'queud_update_profiles'}, _wrapQueue('update_profiles'));
  seneca.add({role: plugin, cmd: 'queud_update_dojos'}, _wrapQueue('update_dojos'));

  /**
  * wrapQueue - englobe a seneca act to push it to a queue to avoid blocking by timeouts
  * @param Function   f   the function to englobe
  * @return
  **/
  function _wrapQueue (f) {
    return function (args, done) {
      var task = {
        role: plugin,
        cmd: f
      };
      _.extend(task, args.param);
      seneca.act({ role: 'queue', cmd: 'enqueue', msg: task, timeout: 120000 }, function (err, res) {
        if (err) done(err);
        done(res);
      });
    };
  }

  this._salesForceLogger = function (level, message) {
    if (level === 'error') {
      seneca.log.error(message);
    } else if (level === 'success') {
      seneca.log.info(message);
    } else if (level === 'info') {
      seneca.log.info(message);
    }
  };

  seneca.add({role: plugin, cmd: 'update_users'}, updateUsers.bind(seneca));
  seneca.add({role: plugin, cmd: 'update_profiles'}, updateProfiles.bind(seneca));
  seneca.add({role: plugin, cmd: 'update_dojos'}, updateDojos.bind(seneca));

  function _accountExistsInSalesForce (userId, cb) {
    var account = seneca.make$('Account');
    account.list$({PlatformId__c: userId}, function (err, data) {
      if (err) return cb(null, {error: 'error getting salesforce account [Platform__c: ' + userId + ']'});

      var id;
      if (data.totalSize > 0) {
        var record = data.records[0];
        if (record) id = record.Id;
      }
      return cb(null, id);
    });
  }

  function _leadExistsInSalesForce (leadId, cb) {
    var lead = seneca.make$('Lead');
    lead.list$({PlatformId__c: leadId}, function (err, data) {
      if (err) return cb(null, {error: 'error getting salesforce lead [Platform__c: ' + leadId + ']'});

      var id;
      if (data.totalSize > 0) {
        var record = data.records[0];
        if (record) id = record.Id;
      }
      return cb(null, id);
    });
  }

  function cmd_get_account (args, cb) {
    var account = seneca.make$('Account');
    account.list$({PlatformId__c: args.platformId}, function (err, data) {
      if (err) return cb(null, {error: 'error getting salesforce account [Platform__c: ' + args.platformId + ']'});
      var id;
      if (data.totalSize > 0) {
        var record = data.records[0];
        if (record) id = record.Id;
      } else if (data && (!data.totalSize || !data.records)) {
        id = data[0].Id || data[0].id;
      } else {
        return cb(null, {error: 'no salesforce id returned'});
      }
      return cb(null, {accId: id});
    });
  }

  function cmd_save_account (args, cb) {
    var seneca = this;

    _accountExistsInSalesForce(args.userId, function (err, salesForceId) {
      if (err) return cb(null, {error: 'error getting salesforce account for save [Platform__c: ' + args.userId + ']'});
      var account = seneca.make$('Account', args.account);
      if (salesForceId) account.id$ = salesForceId;
      account.save$(cb);
    });
  }

  function cmd_list_leads (args, cb) {
    var lead = seneca.make$('Lead');
    lead.list$({}, cb);
  }

  function cmd_save_lead (args, cb) {
    var seneca = this;

    _leadExistsInSalesForce(args.leadId, function (err, salesForceId) {
      if (err) return cb(null, {error: 'error getting salesforce lead for save [Platform__c: ' + args.leadId + ']'});
      var lead = seneca.make$('Lead', args.lead);
      if (salesForceId) lead.id$ = salesForceId;
      lead.save$(cb);
    });
  }

  // We convert a Lead to an Account by calling a custom Apex endpoint.
  // Note we do this directly in JSForce.
  function cmd_convert_lead_to_account (args, cb) {
    var jsforce = require('jsforce');
    var conn = new jsforce.Connection(opts);

    function _connect (cb) {
      conn.identity(function (err, id) {
        if (err) return conn.login(opts.username, opts.password, cb);
        else return cb();
      });
    }

    _connect(function (err) {
      if (err) return cb(err);
      conn.apex.get('/Lead/' + args.leadId, cb);
    });
  }

  return {
    name: plugin
  };
};
