autocode.fuzzy = {
  close: function() {
    $('#fuzzy').remove();
  },
  open: function(opts) {
    var fuzzy = $('#fuzzy');
    if (!fuzzy.length) {
      fuzzy = $(document.createElement('div'));
      $('body').append(fuzzy);
    }
    fuzzy.attr('id', 'fuzzy');
    fuzzy.data('target', opts.target);
    
    var html = '<div class="table">', row;
    for (var i = 0; i < opts.rows.length; i++) {
      row = opts.rows[i];
      html += '<a href="' + row.state + '"><span class="icon ' + row.icon + '"></span><span class="text">' + row.text + '</span></a>';
    }
    html += '</div>';
    
    fuzzy.html(html);
    
    autocode.initState();
    
    autocode.resize();
  }
};