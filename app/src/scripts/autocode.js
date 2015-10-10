var autocode = {
  action: {},
  config: {},
  state: {},
  user: {},
  initState: function() {
    $('a').each(function() {
      if ($(this).data('state')) {
        return;
      }
      
      $(this).data('state', true);
      
      $(this).click(autocode.initStateCallback);
    });
  },
  initStateCallback: function(e) {
    var href = $(this).attr('href');
    if (href.match(/^https?:/)) {
      return true;
    }
    
    var query = href.split('?');
    href = query[0];
    query = autocode.query.search(query[1]);
    
    e.preventDefault();
    
    var action = autocode.state[href];
    if (action) {
      action(query);
      autocode.initState();
    }
    
    autocode.resize();
    
    return false;
  }
};

$(window).load(autocode.init);
$(window).resize(autocode.resize);