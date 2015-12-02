autocode.action.generate = function() {
  if (autocode.data.current.tab == 'config') {
    var config = $('#config-content .CodeMirror')[0].CodeMirror.getValue();
    autocode.project = jsyaml.safeLoad(config);
  }
  
  if (!autocode.project.outputs || !autocode.project.imports) {
    if (!autocode.project.imports) {
      autocode.popup.open({
        title: 'Unable to Generate Project',
        content: '<div style="padding-bottom: 10px">You haven\'t imported any modules yet.</div>'
          + '<a class="button" href="imports">Import a Module</a> <button class="secondary" onclick="autocode.action.closePopup()">Cancel</button>'
      });
    } else {
      autocode.popup.open({
        title: 'Unable to Generate Project',
        content: '<div style="padding-bottom: 10px">You haven\'t added any outputs to your Autocode configuration.</div>'
          + '<a class="button" href="config">Add an Output</a> <button class="secondary" onclick="autocode.action.closePopup()">Cancel</button>'
      });
    }
    
    return;
  }
  
  autocode.ws.io.emit('generate', {
    config: jsyaml.safeDump(autocode.project),
    project: autocode.repo.split('/')[1],
    user: autocode.repo.split('/')[0]
  });
};