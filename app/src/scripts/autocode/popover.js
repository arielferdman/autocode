autocode.popover = {
  close: function() {
    $('#popover').remove();
  },
  open: function(opts) {
    var popover = $(document.createElement('div'));
    popover.attr('id', 'popover');
    if (opts.bottom !== undefined) {
      popover.css('bottom', opts.bottom);
    }
    if (opts.left !== undefined) {
      popover.css('left', opts.left);
    }
    if (opts.right !== undefined) {
      popover.css('right', opts.right);
    }
    if (opts.top !== undefined) {
      popover.css('top', opts.top);
    }
    if (!opts.content) {
      switch (opts.style) {
        case 'table':
          opts.content = '<div class="table">';
          for (var row_i = 0; row_i < opts.rows.length; row_i++) {
            opts.content += '<a href="' + opts.rows[row_i].state + '">'
                + '<span class="icon ' + opts.rows[row_i].icon + '"' + (opts.rows[row_i].style == 'divider' ? ' style="border-top: 1px #CCC solid"' : '') + '></span>'
                + '<span class="text"' + (opts.rows[row_i].style == 'divider' ? ' style="border-top: 1px #CCC solid"' : '') + '>' + opts.rows[row_i].text + '</span>'
              + '</a>';
          }
          opts.content += '</div>';
          break;
      }
    }
    popover.html(opts.content);
    popover.hide();
    $('body').append(popover);
    popover.slideDown();
  },
  toggle: function(opts) {
    if ($('#popover').length) {
      $('#popover').remove();
    } else {
      autocode.popover.open(opts);
    }
  }
};