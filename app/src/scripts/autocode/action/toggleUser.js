autocode.action.toggleUser = function() {
  if (autocode.data.user) {
    autocode.popover.toggle({
      rows: [
        {
          icon: 'settings-icon',
          state: 'user/settings',
          text: 'Settings'
        },
        {
          icon: 'login-icon',
          text: 'View on GitHub',
          state: 'github/user'
        },
        {
          icon: 'logout-icon',
          state: 'user/logout',
          style: 'divider',
          text: 'Logout'
        }
      ],
      right: 0,
      style: 'table',
      target: $('#user'),
      top: $('#main').outerHeight()
    });
  } else {
    autocode.state['user/login']();
  }
  
  autocode.initState();
};