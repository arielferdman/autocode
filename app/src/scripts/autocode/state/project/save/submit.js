autocode.state['project/save/submit'] = function() {
  var data = {
    config: autocode.project,
    message: $('#popup textarea[name="message"]').val(),
    repo: autocode.repo
  };
  
  autocode.popup.open({
    title: 'Saving Project...'
  });
  autocode.popover.close();
  
  autocode.api.config.post({
    data: data,
    error: function(data) {
      autocode.popup.open({
        title: 'Unable to Save Project',
        content: 'Please try again or contact us at <a href="mailto:support@crystal.sh">support@crystal.sh</a>.'
      });
    },
    success: function(data) {
      autocode.data.originalConfig = autocode.object.clone(autocode.project);
      autocode.popup.close();
    }
  });
};