autocode.action.importsExportsTab = function(opts) {
  opts = opts || {};
  
  $('#imports-exports .imports-export').hide();
  $('#imports-exports-' + opts.name).show();
};