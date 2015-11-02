autocode.action.toggleMenu = function() {
  var rows = [];
  if (autocode.data.user) {
    if (autocode.project) {
      rows.push({
        action: 'saveProject',
        text: 'Save Project (Ctrl+Shift+S)',
        icon: 'save-icon'
      });
      rows.push({
        text: 'Close Project',
        icon: 'close-icon',
        state: '/'
      });
      rows.push({
        action: 'githubRepo',
        icon: 'login-icon',
        text: 'View on GitHub'
      });
    }
    
    rows.push({
      action: 'newProject',
      text: 'New Project (Ctrl+Shift+N)',
      icon: 'add-icon',
      style: 'divider'
    });
    rows.push({
      action: 'loadProject',
      text: 'Load Project (Ctrl+Shift+O)',
      icon: 'load-icon'
    });
  } else {
    rows.push({
      action: 'githubLogin',
      text: 'Login with GitHub',
      icon: 'login-icon'
    });
  }
  rows.push({
    text: 'Take a Tour',
    icon: 'tour-icon',
    state: 'tour',
    style: 'divider'
  });
  
  autocode.popover.toggle({
    rows: rows,
    left: 0,
    style: 'table',
    target: $('#menu'),
    top: $('#main').outerHeight()
  });
  
  autocode.initState();
};