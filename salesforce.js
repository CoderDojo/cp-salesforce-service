'use strict';
module.exports = function (opts) {
  var seneca = this;
  var plugin = 'cd-salesforce';

  seneca.add({role: plugin, cmd: 'list_leads'}, cmd_list_leads);
  seneca.add({role: plugin, cmd: 'save_lead'}, cmd_save_lead);
  seneca.add({role: plugin, cmd: 'delete_lead'}, cmd_delete_lead);
  seneca.add({role: plugin, cmd: 'convert_lead_to_account'}, cmd_convert_lead_to_account);
  seneca.add({role: plugin, cmd: 'save_account'}, cmd_save_account);

  function _accountExistsInSalesForce(userId, cb) {
    var account = seneca.make$('Account');
    account.list$({PlatformId__c: userId}, function(err, data) {
      if (err) return cb(err);

      var id;
      if (data.totalSize > 0) {
        var record = data.records[0];
        if (record) id = record.Id;
      }
      return cb(null, id);
    });
  };

  function _leadExistsInSalesForce(leadId, cb) {
    var lead = seneca.make$('Lead');
    lead.list$({PlatformId__c: leadId}, function(err, data) {
      if (err) return cb(err);

      var id;
      if (data.totalSize > 0) {
        var record = data.records[0];
        if (record) id = record.Id;
      }
      return cb(null, id);
    });
  };

  function cmd_save_account (args, cb) {
    var seneca = this;

    _accountExistsInSalesForce(args.userId, function(err, salesForceId) {
      if (err) return cb(err);
      var account = seneca.make$('Account', args.account);
      if (salesForceId) account.id$ = salesForceId;
      account.save$(cb);
    });
  };

  function cmd_list_leads (args, cb) {
    var lead = seneca.make$('Lead');
    lead.list$({}, cb);
  }

  function cmd_save_lead (args, cb) {
    var seneca = this;

    _leadExistsInSalesForce(args.userId, function(err, salesForceId) {
      if (err) return cb(err);
      var lead = seneca.make$('Lead', args.lead);
      if (salesForceId) lead.id$ = salesForceId;
      lead.save$(cb);
    });
  }

  function cmd_delete_lead (args, cb) {
    var seneca = this;
    var lead = seneca.make$('Lead');
    lead.remove$(args.lead.Id, cb);
  }

  // We convert a Lead to an Account by calling a custom Apex endpoint.
  // Note we do this directly in JSForce.
  function cmd_convert_lead_to_account(args, cb) {
    var jsforce = require('jsforce');
    var conn = new jsforce.Connection(opts);

    function _connect (cb) {
      conn.identity(function (err, id) {
        if (err) return conn.login(opts.username, opts.password, cb);
        else return cb();
      });
    };

    _connect(function (err) {
      if (err) return cb(err);
      conn.apex.get('/Lead/' + args.leadId, cb);
    });
  }

  return {
    name: plugin
  };
};
