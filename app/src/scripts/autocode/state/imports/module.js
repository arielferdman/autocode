autocode.state['imports/module'] = function(opts) {
  $('#imports-content input[name="name"]').val(opts.repo);
  $('#imports-content input[name="version"]').val(autocode.project.imports[opts.repo]);
  $('#imports-content-readme').text('');
  
  autocode.api.readme.get({
    data: {
      repo: opts.repo
    },
    success: function(data) {
      var button = $(document.createElement('button'));
      button.attr('type', 'button');
      button.click(function() {
        if (!autocode.project.outputs) {
          autocode.project.outputs = [];
        }
        var outputs = jsyaml.safeLoad($(this).next().next().next().find('.CodeMirror')[0].CodeMirror.getValue()).outputs;
        for (var i in outputs) {
          autocode.project.outputs.push(outputs[i]);
        }
        autocode.state['config']();
        autocode.resize.all();
      });
      button.css('float', 'right');
      button.text('Add Example to Config');
      
      var readme = marked(data.readme);
      $('#imports-content-readme').html(readme);
      $('#imports-content-readme').find('#example-input').before(button);
      $('#imports-content-readme').find('p a img').remove();
      $('#imports-content-readme').find('#install').remove();
      $('#imports-content-readme').find('p').eq(2).remove();
      $('#imports-content-readme').find('pre').eq(0).remove();
      $('#imports-content-readme').find('p').eq(2).remove();
      $('#imports-content-readme').find('pre').eq(0).remove();
      
      $('.lang-dockerfile').each(function() {
        var value = $(this).text();
        value = value.replace(/\n$/, '');
        $(this).text('');
        
        CodeMirror(this, {
          lineNumbers: true,
          value: value,
          mode: 'dockerfile',
          readOnly: true,
          viewportMargin: Infinity
        });
      });
      
      $('.lang-go').each(function() {
        var value = $(this).text();
        value = value.replace(/\n$/, '');
        $(this).text('');
        
        CodeMirror(this, {
          lineNumbers: true,
          value: value,
          mode: 'go',
          readOnly: true,
          viewportMargin: Infinity
        });
      });
      
      $('.lang-html').each(function() {
        var value = $(this).text();
        value = value.replace(/\n$/, '');
        $(this).text('');
        
        CodeMirror(this, {
          lineNumbers: true,
          value: value,
          mode: 'htmlmixed',
          readOnly: true,
          viewportMargin: Infinity
        });
      });
      
      $('.lang-js').each(function() {
        var value = $(this).text();
        value = value.replace(/\n$/, '');
        $(this).text('');
        
        CodeMirror(this, {
          lineNumbers: true,
          mode: 'javascript',
          value: value,
          readOnly: true,
          viewportMargin: Infinity
        });
      });
      
      $('.lang-json').each(function() {
        var value = $(this).text();
        value = value.replace(/\n$/, '');
        $(this).text('');
        
        CodeMirror(this, {
          lineNumbers: true,
          value: value,
          mode: 'javascript',
          readOnly: true,
          viewportMargin: Infinity
        });
      });
      
      $('.lang-python').each(function() {
        var value = $(this).text();
        value = value.replace(/\n$/, '');
        $(this).text('');
        
        CodeMirror(this, {
          lineNumbers: true,
          mode: 'python',
          value: value,
          readOnly: true,
          viewportMargin: Infinity
        });
      });
      
      $('.lang-yaml').each(function() {
        var value = $(this).text();
        value = value.replace(/\n$/, '');
        $(this).text('');
        
        CodeMirror(this, {
          lineNumbers: true,
          value: value,
          mode: 'yaml',
          readOnly: true,
          viewportMargin: Infinity
        });
      });
      
      $('.lang-sh').each(function() {
        var value = $(this).text();
        value = value.replace(/\n$/, '');
        $(this).text('');
        
        CodeMirror(this, {
          lineNumbers: true,
          value: value,
          mode: 'shell',
          readOnly: true,
          viewportMargin: Infinity
        });
      });
      
      $('.lang-text').each(function() {
        var value = $(this).text();
        value = value.replace(/\n$/, '');
        $(this).text('');
        
        CodeMirror(this, {
          lineNumbers: true,
          value: value,
          readOnly: true,
          viewportMargin: Infinity
        });
      });
    }
  });
};