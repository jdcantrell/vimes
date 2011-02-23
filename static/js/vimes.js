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
            if (autoSave.lastSave != null) {
                var seconds = Math.floor((new Date() - autoSave.lastSave) / 1000)
                if (seconds < 60) {
                    time =  '(' + seconds + "s ago)"
                }
                else if (seconds < 3600) {
                    time = '(' + Math.floor(seconds / 60) + "m ago)"
                }
                else {
                    time = '(' + Math.floor(seconds / 3600) + "h ago)"
                }
            }
            $('#status-message').text('Saved ' + time);
        }
    },
    saveComplete: function() {
        autoSave.lastSave = new Date()
        if (autoSave.state == 'dirty') {
            $('#status-message').text('You have unsaved changes.');
        }
        else {
            autoSave.state = 'clean'
            $('#status-message').text('Saved (right now)');
        }
    }
};

function serialize() {
    var lists = $('.list');
    var page = {};
    var reg = / |column|ui-sortable/g;
    lists.each(function(index, list) {
        var col = 'column' + $(list).parent().attr('class').replace(reg, '');
        var listId = 'list-' + index
        if (typeof page[col] == 'undefined') page[col] = {};

        //get list details
        page[col][listId] = {
            header: $(list).children('h1').text(),
            cls: $(list).attr('class').replace('list', ''),
            type: 'ul',
            items: []
        };

        //get each item in the list
        var items = $(list).children('ul,ol').children('li').children('div')
        items.each(function(idx, item) {
            if ($(item).parents('ol').length) {
                page[col][listId].type = 'ol';
            }
            page[col][listId].items.push($(item).text());
        });

    });

    return JSON.stringify(page);
}

//resize columns when dragging lists to make it easier to place them on empty columns
function resizeColumns(e, ui) {
    var minHeight = 0;
    $('.column').each(function(idx, col) {
        $('.column').css('min-height', 0);
        var h = $(col).height();
        minHeight = (h > minHeight) ? h : minHeight;
    });
    $('.column').css('minHeight', minHeight);
}

//header functions
function editHeader(e) {
    autoSave.dirty();
    if (e.which == 13) e.preventDefault();
}

//list functions
function completeListEdit() {
    autoSave.dirty();
    if ($(this).text().replace(/\W+/g, '') == '') {
        $(this).remove();
    }
}

function editListItem(e) {
    autoSave.dirty();
    switch (e.which) {
        case 13: //up
            e.preventDefault();
            $(this).after('<li><span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">I am a new item!</div></li>');
            var next = $(this).next().children('div').get(0);
            next.focus();
            focusEditable(next);
            break;
        case 40: //down
            var next = $(this).next().children('div').get(0);
            if (next != null) {
                next.focus();
                focusEditable(next, true);
            }
            break;
        case 38: //up
            var next = $(this).prev().children('div').get(0);
            if (next != null) {
                next.focus();
                focusEditable(next, true);
            }
            break;
    }
}

function createList(e) {
    e.preventDefault()
    autoSave.dirty();
    var li = $(document.createElement('li'));
    var h1 = $(document.createElement('h1'));
    var ul = $(document.createElement('ul'));

    h1.attr('contentEditable', true);
    h1.html('New List');

    ul.append('<li><span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">Click here to edit your new list</div>');
    ul.sortable({handle: 'span', revert: true});

    li.addClass('list');
    li.append(h1);
    li.append(ul);
    $(this).parent().before(li);
    return false
}

function markItem(e) {
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

function removeItem(e) {
    autoSave.dirty();
    $(this).parent().remove();
}

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

//toolbar functions
function displayToolbar(item) {
    if (typeof item.currentTarget != 'undefined') {
        //called from an event handler no item given
        var item = this;
    }
    var pos = $(item).offset();
    $('#toolbar').css('top', pos.top + 35);
    $('#toolbar').css('left', pos.left + 0);
    if (showHover) $('#toolbar').css('display', 'block');
    $(item).append($('#toolbar'));
    $('#color-button').removeClass('active');
}

function removeList() {
    autoSave.dirty();
    $('#toolbar').css('display', 'none');
    var list = $('#toolbar').parent();
    $(document.body).append($('#toolbar'));
    list.remove();
    return false;
}

function displayColorList() {
    $(this).parent().toggleClass('active');
    return false;
}

function setListColor() {
    autoSave.dirty();
    var list = $(this).parents('.list');
    list.css('color', '');
    var currentClass = list.attr('class').match(/[a-z0-9-]*-text/);
    if (currentClass != null) {
        list.removeClass(currentClass[0]);
    }
    var classes = $(this).attr('class');
    var reg = /[a-z0-9-]*-background/;
    list.addClass(classes.match(reg)[0].replace('background', 'text'));
    $(this).parents('#color-button').toggleClass('active');
    return false;
}

function setCustomColor() {
    autoSave.dirty();
    var colorInput = $(this).prev();
    var list = $(this).parents('.list');
    list.css('color', colorInput[0].value);
    var currentClass = list.attr('class').match(/[a-z0-9-]*-text/);
    if (currentClass != null) {
        list.removeClass(currentClass[0]);
    }
    colorInput[0].value = '';
    $(this).parents('#color-button').toggleClass('active');
}

var showHover = true;
$(document).ready(function() {
    //set up column actions
    $('.column').append('<li class="add-button"><a href="#" class="button blue">Create list!</a></li>');
    $('.add-button a').click(createList);
    $('.fourcol').hover(
        function() {if (showHover) $(this).addClass('hover')},
        function() {$(this).removeClass('hover')}
    );
    $('.column').sortable({
        connectWith: '.column',
        handle: 'h1',
        placeholder: 'placeholder',
        forcePlaceholderSize: true,
        forceHelperSize: true,
        revert: true,
        sort: resizeColumns,
        start: function(event, ui) {
            ui.placeholder.height($(ui.item).height());
            ui.placeholder.parents('.fourcol').removeClass('hover');
            showHover = false;
            $('#toolbar').css('display', 'none');
        },
        stop: function(event, ui) {
            autoSave.dirty();
            var add = ui.item.parent('.column').children('.add-button');
            add.appendTo(ui.item.parent('.column'));
            ui.item.parents('.fourcol').addClass('hover');
            showHover = true;
            displayToolbar(ui.item);
            $('#toolbar').css('display', 'block');
        }
    });

    //set up header actions
    $('.workarea h1').attr('contentEditable', true);
    $('.workarea h1').live('keydown', editHeader);

    //set up list actions
    $('.list').live('mouseenter', displayToolbar);
    $('.list ul > li, .list ol > li').each(function(idx, el) {
        $(el).html('<span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">' + $(el).html() + '</div>');
    });
    $('.list ul > li, .list ol > li').live('keydown', editListItem);
    $('.list ul > li, .list ol > li').live('blur', completeListEdit);
    $('.list ul, .list ol').sortable({handle: 'span', revert: true});
    $('.list ul span, .list ol span').live('click', markItem);
    $('.list ul span, .list ol span').live('dblclick', removeItem);

    //set up toolbar
    $('#delete-button').click(removeList);
    $('#color-button > a').click(displayColorList);
    $('.color-swatch').click(setListColor);
    $('#set-color').click(setCustomColor);
    $('.status').append('<a title="Click to save now" class="auto-save" href="#" onclick="save();return false"><span id="status-message">Everthing is all good!</span><a>');
    window.setInterval(autoSave.save, 5000);
});
