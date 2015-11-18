autocode.action.loadExport = function(opts) {
  opts = opts || {};
  
  autocode.data.current.export = opts.name || autocode.data.current.export;
  
  var export_data = autocode.project.exports[autocode.data.current.export];
  
  $('#exports-content-container .table a').removeClass('selected');
  $('#exports-' + autocode.data.current.export).addClass('selected');
  
  $('#exports-name .value').text(autocode.data.current.export || ' [ Click to Add ]');
  $('#exports-type .value').text(export_data.type.substr(0, 1).toUpperCase() + export_data.type.substr(1) || ' [ Click to Add ]');
  $('#exports-description .value').text(export_data.description || ' [ Click to Add ]');
  $('#exports-engine .value').text(export_data.engine || ' [ Click to Add ]');
  $('#exports-filename .value').text(export_data.filename || ' [ Click to Add ]');
  $('#exports-format .value').text(export_data.format || ' [ Click to Add ]');
  $('#exports-schema .value').text(export_data.schema || ' [ Click to Add ]');
  
  var code_mirror = $('#exports-content .CodeMirror');
  var mode = 'text', tabs = [], value = jsyaml.safeDump(autocode.project);
  switch (export_data.type) {
    case 'engine': {
      value = export_data.engine || "\n";
      break;
    }
    case 'generator': {
      $('#exports-engine').show();
      $('#exports-filename').show();
      $('#exports-format').show();
      $('#exports-schema').show();
      
      tabs = ['template'];
      
      mode = export_data.format;
      value = export_data.template || "\n";
      
      break;
    }
    case 'helper': {
      $('#exports-engine').hide();
      $('#exports-filename').hide();
      $('#exports-format').hide();
      $('#exports-schema').hide();
      
      tabs = ['helper'];
      
      mode = 'javascript';
      value = export_data.helper || "\n";
      
      break;
    }
    case 'processor': {
      $('#exports-engine').hide();
      $('#exports-filename').hide();
      $('#exports-format').hide();
      $('#exports-schema').hide();
      
      tabs = ['processor'];
      
      mode = 'javascript';
      value = export_data.processor || "\n";
      
      break;
    }
    case 'schema': {
      $('#exports-engine').hide();
      $('#exports-filename').hide();
      $('#exports-format').hide();
      $('#exports-schema').hide();
      
      tabs = ['schema'];
      
      mode = 'yaml';
      value = export_data.schema ? jsyaml.safeDump(export_data.schema) : "\n";
      
      break;
    }
  }
  
  $('#exports-tabs').text('');
  
  var tab;
  for (var i = 0; i < tabs.length; i++) {
    tab = tabs[i];
    $('#exports-tabs').append('<a id="exports-' + tab + '-tab" onclick="autocode.action.exportsTab({ tab: \'' + tab + '\' })">' + tab.substr(0,1).toUpperCase() + tab.substr(1) + '</a>')
  }
  
  if (!code_mirror.length) {
    var editor = CodeMirror.fromTextArea($('#exports-content textarea')[0], {
      lineNumbers: true,
      mode: mode
    });
    
    code_mirror = $('#exports-content .CodeMirror')
    code_mirror[0].CodeMirror.setValue("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
    code_mirror[0].CodeMirror.setValue(value);
    
    $('.CodeMirror-scroll').scrollTop(2);
    
  } else {
    code_mirror[0].CodeMirror.setValue("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
    code_mirror[0].CodeMirror.setValue(value);
  }
  
  code_mirror[0].CodeMirror.setOption('mode', mode);
  
  autocode.hint.init();
  
  autocode.resize.all();
};