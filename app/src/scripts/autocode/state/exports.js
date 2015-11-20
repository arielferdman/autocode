autocode.state['exports'] = function() {
  if (autocode.project.exports) {
    $('#exports-content-container .table a').slice(1).remove();
    
    var exported;
    for (var export_name in autocode.project.exports) {
      exported = autocode.project.exports[export_name];
      
      $('#exports-content-container .table').append(
        '<a class="file" id="exports-' + export_name + '" onclick="autocode.action.loadExport({ name: \'' + export_name + '\' })">'
          + '<span class="image">'
            + '<span class="icon ' + exported.type.toLowerCase() + '-icon"></span>'
          + '</span>'
          + '<span class="info">'
            + '<span class="name">' + export_name + '</span>'
            + '<span class="generator">' + exported.type + '</span>'
          + '</span>'
        + '</a>'
      );
    }
    
    autocode.initState()
    
    $('#exports-init').hide();
    $('#exports-content-container').show();
    
    autocode.action.loadExport();
    
  } else {
    $('#exports-init').show();
    $('#exports-content-container').hide();
  }
  
  autocode.action.toggleSection('exports');
};