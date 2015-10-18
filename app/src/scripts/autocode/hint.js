autocode.hint = {
  timer: null,
  close: function(opts) {
    opts = opts || {};
    if (opts.animated === false) {
      $('#hint, #hint-arrow').remove();
    } else {
      $('#hint, #hint-arrow').fadeOut(function() {
        $('#hint, #hint-arrow').remove();
      });
    }
  },
  init: function() {
    $('*[data-hint]').each(function() {
      $(this).bind({
        mouseenter: function() {
          autocode.hint.open({
            target: $(this),
            text: $(this).data('hint')
          });
          
          autocode.resize.hint();
        },
        mouseleave: function() {
          autocode.hint.close();
        }
      });
    });
  },
  open: function(opts) {
    clearTimeout(autocode.hint.timer);
    
    var hint = $('#hint');
    if (!hint.length) {
      hint = $(document.createElement('div'));
      hint.attr('id', 'hint');
      $('body').append(hint);
    }
    if (opts.minTop !== undefined) {
      hint.data('minTop', opts.minTop);
    } else {
      hint.removeData('minTop');
    }
    if (opts.offsetTop !== undefined) {
      hint.data('offsetTop', opts.offsetTop);
    } else {
      hint.removeData('offsetTop');
    }
    hint.data('originalText', opts.text);
    if (opts.scrollUp) {
      hint.data('scrollUp', opts.scrollUp);
    } else {
      hint.removeData('scrollUp');
    }
    if (opts.top !== undefined) {
      hint.data('top', opts.top);
    } else {
      hint.removeData('top');
    }
    
    var hint_arrow = $('#hint-arrow');
    if (!hint_arrow.length) {
      hint_arrow = $(document.createElement('div'));
      hint_arrow.attr('id', 'hint-arrow');
      $('body').append(hint_arrow);
    }
    
    hint.data('target', opts.target);
    hint.html(opts.text);
    
    if (opts.timer) {
      autocode.hint.timer = setTimeout(function() {
        autocode.hint.close();
      }, opts.timer);
    }
  }
};