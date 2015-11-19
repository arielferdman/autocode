if (window.location.protocol == 'https:') {
  window.location.href = 'http:' + window.location.href.substring(window.location.protocol.length);
} else if (window.location.hostname == 'autocode.crystal.sh') {
  window.location.href = 'http://app.autocode.run';
}

jQuery.fn.extend({
  visibleHeight: function() {
    var o = $(this);
    if (o.is(':hidden')) {
      return 0;
    } else {
      return o.outerHeight();
    }
  },
  visibleWidth: function() {
    var o = $(this);
    if (o.is(':hidden')) {
      return 0;
    } else {
      return o.outerWidth();
    }
  }
});

var autocode = {
  action: {},
  config: {},
  data: {
    current: {
      pin: true
    },
    exportTypes: ['engine','generator','helper','processor','schema','spec','transformer']
  },
  state: {},
  user: {},
  initState: function() {
    $('a').each(function() {
      if ($(this).data('state')) {
        return;
      }
      
      $(this).data('state', true);
      
      if (navigator.userAgent.match(/mobile/i)) {
        $(this).bind({
          touchstart: function() {
            $(window).removeData('scrolled');
          },
          touchend: function(e) {
            if ($(window).data('scrolled')) {
              return false;
            }
            return autocode.initStateCallback(e, $(this));
          }
        });
      } else {
        $(this).click(autocode.initStateCallback);
      }
    });
  },
  initStateCallback: function(e, o) {
    var o = o || $(this);
    var href = o.attr('href');
    if (!href) {
      return false;
    } else if (href.match(/^https?:/)) {
      // open new window
      window.open(href, '_blank');
      
      // close popover
      autocode.popover.close();
      
      return false;
    }
    
    e.preventDefault();
    
    // get query
    var query = href.split('?');
    href = query[0];
    query = autocode.query.search(query[1]);
    
    autocode.ga.send('pageview', href);
    
    console.log(href);
    
    // get name
    var name = href.split('/').splice(0, 2).join('/');
    
    // get state name
    var state_name = href;
    if (name == autocode.repo) {
      state_name = state_name.split('/').splice(2).join('/');
    }
    var state = autocode.state[state_name];
    if (state) {
      $('input:focus').blur();
      state(query);
      autocode.initState();
    } else if (!state) {
      autocode.action.loadProject({ force: true, name: name });
    }
    
    history.pushState(null, null, href);
    
    if (autocode.listener.listeners[state_name]) {
      for (var listener_name in autocode.listener.listeners[state_name]) {
        autocode.listener.listeners[state_name][listener_name](query);
      }
    }
    
    autocode.resize.all();
    
    return false;
  }
};

$(window).load(autocode.init);
$(window).resize(autocode.resize);