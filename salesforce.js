'use strict';

module.exports = function (options) {
  var seneca = this;
  var plugin = 'cd-salesforce';

  seneca.add({role: plugin, cmd: 'list_leads'}, cmd_list_leads);
  seneca.add({role: plugin, cmd: 'save_lead'}, cmd_save_lead);
  seneca.add({role: plugin, cmd: 'delete_lead'}, cmd_delete_lead);

  function _userExistsInSalesForce(userId, cb) {
    var lead = seneca.make$('Lead');
    lead.list$({PlatformId__c: userId}, function(err, data) {
      if (err) return cb(err);

      var id;
      if (data.totalSize > 0) {
        var record = data.records[0];
        if (record) id = record.Id;
      }
      return cb(null, id);
    });
  };

  function cmd_list_leads (args, cb) {
    var lead = seneca.make$('Lead');
    lead.list$({}, cb);
  }

  function cmd_save_lead (args, cb) {
    var seneca = this;

    _userExistsInSalesForce(args.userId, function(err, salesForceId) {
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

  return {
    name: plugin
  };
};
