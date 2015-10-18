autocode.state['output/file'] = function(opts) {
  autocode.action.toggleColumn('output-content', 2);
  
  var code_mirror = $('#output-content .CodeMirror');
  var value = autocode.data.output.files[opts.file];
  
  var mode = 'text';
  switch (true) {
    case !!opts.file.match(/\.coffee$/): {
      mode = 'coffeescript';
      break;
    }
    case opts.file == 'Dockerfile': {
      mode = 'dockerfile';
      break;
    }
    case !!opts.file.match(/\.htm$/) || !!opts.file.match(/\.html$/): {
      mode = 'htmlmixed';
      break;
    }
    case !!opts.file.match(/\.ini$/): {
      mode = 'ini';
      break;
    }
    case opts.file == '.bowerrc'
      || opts.file == '.eslintrc'
      || !!opts.file.match(/\.js$/)
      || !!opts.file.match(/\.json$/): {
      mode = 'javascript';
      break;
    }
    case opts.file == 'AUTHORS' || !!opts.file.match(/\.md$/): {
      mode = 'markdown';
      break;
    }
    case !!opts.file.match(/\.py$/): {
      mode = 'python';
      break;
    }
    case !!opts.file.match(/\.rb$/): {
      mode = 'ruby';
      break;
    }
    case !!opts.file.match(/\.sass$/): {
      mode = 'sass';
      break;
    }
    case !!opts.file.match(/\.yml$/) && !!opts.file.match(/\.yaml$/): {
      mode = 'yaml';
      break;
    }
  }
  
  if (!code_mirror.length) {
    var editor = CodeMirror.fromTextArea($('#output-content textarea')[0], {
      lineNumbers: true,
      readOnly: true,
      mode: mode
    });
    
    code_mirror = $('#output-content .CodeMirror')
    code_mirror[0].CodeMirror.setValue(value);
    
    $('.CodeMirror-scroll').scrollTop(2);
    
  } else {
    code_mirror[0].CodeMirror.setOption('mode', mode);
    code_mirror[0].CodeMirror.setValue(value);
  }
  
  autocode.resize.all();
};