'use strict';

module.exports = function (options) {
  var seneca = this;
  var plugin = 'cd-salesforce';

  seneca.add({role: plugin, cmd: 'list_leads'}, cmd_list_leads);
  seneca.add({role: plugin, cmd: 'create_lead'}, cmd_create_lead);
  seneca.add({role: plugin, cmd: 'delete_lead'}, cmd_delete_lead);

  function cmd_list_leads (args, cb) {
    var lead = seneca.make$('Lead');
    lead.list$({}, cb);
  }

  function cmd_create_lead (args, cb) {
    var seneca = this;
    var lead = seneca.make$('Lead', args.lead);
    lead.save$(cb);
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
