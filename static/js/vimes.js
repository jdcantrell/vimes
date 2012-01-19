//Focus code found and based on:
//http://stackoverflow.com/questions/2871081/jquery-setting-cursor-posistion-in-contenteditable-div
function focusEditable(el, collapse) {
  window.setTimeout(function() {
    var sel, range;
    if (window.getSelection && document.createRange) {//for standards
      range = document.createRange();
      range.selectNodeContents(el);
      if (collapse) range.collapse();
      sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    else if (document.body.createTextRange) {// for IE
      range = document.body.createTextRange();
      range.moveToElementText(el);
      if (collapse) range.collapse();
      range.select();
    }
  }, 1);
}
////////////////////////////////////

var autoSave = {
  state: 'clean',
  lastSave: null,
  dirty: function() {
    if (autoSave.state != 'dirty') {
      $('#status-message').text('You have unsaved changes.');
    }
    autoSave.state = 'dirty';
  },
  save: function() {
    if (autoSave.state == 'dirty') {
      $('#status-message').text('Saving...');
      save();
      autoSave.state = 'saving';
    }
    else if (autoSave.state == 'clean') {
      var time = "";
      if (autoSave.lastSave !== null) {
        var seconds = Math.floor((new Date() - autoSave.lastSave) / 1000);
        if (seconds < 60) {
          time =  '(' + seconds + "s ago)";
        }
        else if (seconds < 3600) {
          time = '(' + Math.floor(seconds / 60) + "m ago)";
        }
        else {
          time = '(' + Math.floor(seconds / 3600) + "h ago)";
        }
      }
      $('#status-message').text('Saved ' + time);
    }
  },
  saveComplete: function() {
    autoSave.lastSave = new Date();
    if (autoSave.state == 'dirty') {
      $('#status-message').text('You have unsaved changes.');
    }
    else {
      autoSave.state = 'clean';
      $('#status-message').text('Saved (right now)');
    }
  }
};


//list functions

function saveFail(a, b, c) {}

function save() {
  var list = window.location.href.split('/').pop();
  $.ajax({
    type: 'POST',
    data: {data: serialize()},
    url: '/' + list + '/save',
    success: autoSave.saveComplete,
    error: saveFail
  });
}

function serialize() {}

var ListEditor = function(list) {
  var header = list.find('h1');
  var element = list.find('ul, ol');

  //private methods
  var serialize = function() {
    var lists = $('.list');
    var page = {};
    var reg = / |column|ui-sortable/g;
    lists.each(function(index, list) {
      var col = 'column' + $(list).parent().attr('class').replace(reg, '');
      var listId = 'list-' + index;
      if (typeof page[col] == 'undefined') page[col] = {};

      //get list details
      page[col][listId] = {
        header: $(list).children('h1').text(),
        cls: $(list).attr('class').replace('list', ''),
        type: 'ul',
        items: []
      };

      //get each item in the list
      var items = $(list).children('ul,ol').children('li').children('div');
      items.each(function(idx, item) {
        if ($(item).parents('ol').length) {
          page[col][listId].type = 'ol';
        }
        page[col][listId].items.push($(item).text());
      });

    });

    return JSON.stringify(page);
  }

//header functions
  var editHeader = function(e) {
    autoSave.dirty();
    if (e.which == 13) e.preventDefault();
  }

  var remove = function(e) {
    autoSave.dirty();
    $(this).parent('li').remove();
  }

  var mark = function(e) {
    autoSave.dirty();
    $(this).parent().toggleClass('marked');
    //clear selection
    if (window.getSelection) {
      if (window.getSelection().empty) window.getSelection().empty();
      else if (window.getSelection().removeAllRanges) {
        window.getSelection.removeAllRanges();
      }
    }
    else if (document.selection) {
      document.selection.empty();
    }
  }

  var editItem = function(e) {
    autoSave.dirty();
    var next;
    switch (e.which) {
      case 13: //up
        e.preventDefault();
        $(this).after('<li><span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">I am a new item!</div></li>');
        next = $(this).next().children('div').get(0);
        next.focus();
        focusEditable(next);
        break;
      case 40: //down
        next = $(this).next().children('div').get(0);
        if (next !== null) {
          next.focus();
          focusEditable(next, true);
        }
        break;
      case 38: //up
        next = $(this).prev().children('div').get(0);
        if (next !== null) {
          next.focus();
          focusEditable(next, true);
        }
        break;
    }
  }
  
  function completeListEdit() {
    autoSave.dirty();
    if ($(this).text().replace(/\W+/g, '') === '') {
      $(this).remove();
    }
  }

  //initialize listeners
  //set up header actions
  header.attr('contentEditable', true);
  header.bind('keydown', editHeader);

  //set up list actions
  console.log(header, element.find('li'))
  //enable contente editable
  element.find('li').each(function(idx, el) {
    $(el).html('<span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">' + $(el).html() + '</div>');
  });

  element.find('li').live('keydown', editItem).live('blur', completeListEdit)
  element.sortable({handle: 'span', revert: true});

  //ad mark and remove
  element.find('span').live('click', mark);
  element.find('span').live('dblclick', remove);
}

$(document).ready(function() {
  ListEditor($('.list'))

  $('html').click(function(event) {
    if (event.target == this) {
      var css = parseInt($(this).attr('class').match(/bg([0-9]*)/)[1])
      $(this).addClass('bg' + ((css < 13 ? css : 0) + 1))
      $(this).removeClass('bg' + css)
    }
  });

  $('.status').append('<a title="Click to save now" class="auto-save" href="#" onclick="save();return false"><span id="status-message">Everthing is all good!</span><a>');
  window.setInterval(autoSave.save, 5000);
});
