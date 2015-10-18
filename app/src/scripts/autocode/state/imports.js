autocode.state['imports'] = function(opts) {
  opts = opts || {};
  
  autocode.popup.close();
  
  autocode.action.toggleColumn('imports-content', 1, {
    animated: autocode.data.current.tab == 'imports'
      ? true
      : false
  });
  autocode.action.toggleSection('imports');
  
  $('#imports-content-container .table a').remove();
  
  var import_index = 0, import_version;
  for (var import_name in autocode.object.sort(autocode.project.imports)) {
    import_version = autocode.project.imports[import_name];
    
    $('#imports-content-container .table').append(
      '<a class="file' + (autocode.data.current.import == import_name ? ' selected' : '') + '" href="imports/module?repo=' + import_name + '&index=' + import_index + '">'
        + '<span class="image"><span class="icon" style="background-image: url(https://cdn.rawgit.com/' + import_name + '/master/.autocode/icon.svg)"></span></span>'
        + '<span class="info">'
          + '<span class="name">' + import_name + '</span>'
          + '<span class="generator">' + import_version + '</span>'
        + '</span>'
      + '</a>'
    );
    
    import_index++;
  }
  
  autocode.initState();
  
  if (autocode.project.imports) {
    $('#imports-content-container .content-right').show();
  } else {
    $('#imports-content-container .content-right').hide();
  }
  
  $('#imports-content-container').show();
  
  if (opts.disableSelected !== true && $(window).width() > 600) {
    $('#imports-content-container .table a').first().click();
  }
  
  if (!autocode.data.modules) {
    autocode.api.modules.get({
      success: function(modules) {
        autocode.data.modules = modules;
        
        $('#imports-search').keyup(function(e) {
          if (e.keyCode == 13) {
            if (!$(this).val().length || !$('#fuzzy a').first().find('.text').length) {
              return false;
            }
            var text = $('#fuzzy a').first().find('.text').text();
            autocode.state.push('imports/add', { repo: text });
            $(this).val('');
            autocode.fuzzy.close();
            return false;
          }
          
          var value = $(this).val();
          
          var mod, modules = [];
          for (var module_i in autocode.data.modules) {
            module_name = autocode.data.modules[module_i].name;
            if (autocode.project.imports && autocode.project.imports[module_name]) {
              continue;
            }
            if (module_name.match(new RegExp(value, 'i'))) {
              modules.push({
                icon: 'https://cdn.rawgit.com/' + module_name + '/master/.autocode/icon.svg',
                state: 'imports/add?repo=' + module_name,
                text: module_name
              });
            }
          }
          autocode.fuzzy.open({
            rows: modules,
            target: $(this),
            value: value
          });
        });
      }
    });
  }
};