//Focus code found and based on:
//http://stackoverflow.com/questions/2871081/jquery-setting-cursor-posistion-in-contenteditable-div
function focusEditable(el,collapse) {
	window.setTimeout(function() {
			var sel, range
			if (window.getSelection && document.createRange) {//for standards 
				range = document.createRange()
				range.selectNodeContents(el)
				if (collapse) range.collapse()
				sel = window.getSelection()
				sel.removeAllRanges()
				sel.addRange(range);
			}
			else if (document.body.createTextRange) {// for IE
				range = document.body.createTextRange()
				range.moveToElementText(el);
				if (collapse) range.collapse()
				range.select()
			}
	}, 1)
}
////////////////////////////////////

messenger = {
    updates: 0,
    update: function(msg) {
        messenger.updates++
        $('#status-message').text(msg)
    },
    complete: function () {
        messenger.updates--
        if (messenger.updates == 0) {
            $('#status-message').text('Everything is all good!')
        }
    }
}
autoSave = {
    dirty: function() {
        autoSave.saveFlag = true
        messenger.update('You have unsaved changes')
    },
    save: function() {
        if (autoSave.saveFlag) {
            messenger.updates--
            save()
        }
        autoSave.saveFlag = false
    }
}

function resizeColumns(e, ui) {
	var minHeight = 0
	$('.column').each(function (idx, col) {
		$('.column').css('min-height', 0)
		var h = $(col).height()
		minHeight = (h > minHeight) ? h : minHeight
	})
	$('.column').css('minHeight',minHeight)
}

function editHeader(e) {
    autoSave.dirty()
	if (e.which == 13) e.preventDefault()
}

function completeListEdit() {
    autoSave.dirty()
	if ($(this).text().replace(/\W+/g,'') == "") {
		$(this).remove()
	}
}

function editListItem(e) {
    autoSave.dirty()
	switch(e.which) {
		case 13: //up
			e.preventDefault()
			$(this).after('<li><span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">I am a new item!</div></li>')
			var next = $(this).next().children('div').get(0)
			next.focus()
			focusEditable(next)
			break;
		case 40: //down
			var next = $(this).next().children('div').get(0)
			if (next != null) {
				next.focus()
				focusEditable(next, true)
			}
			break;
		case 38: //up
			var next = $(this).prev().children('div').get(0)
			if (next != null) {
				next.focus()
				focusEditable(next, true)
			}
			break;
	}
}

function createList() {
    autoSave.dirty()
	var li = $(document.createElement('li'))
	var h1 = $(document.createElement('h1'))
	var ul = $(document.createElement('ul'))

	h1.attr('contentEditable', true)
	h1.html('New List')

	ul.append('<li><span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">Click here to edit your new list</div>')
	ul.sortable({handle:'span', revert:true})
	
	li.addClass('list')
	li.append(h1)
	li.append(ul)
	$(this).parent().before(li)
}

function markItem(e) {
    autoSave.dirty()
	$(this).parent().toggleClass('marked')
	//clear selection
	if (window.getSelection) {
		if (window.getSelection().empty) window.getSelection().empty()
		else if (window.getSelection().removeAllRanges) window.getSelection.removeAllRanges()
	}
	else if (document.selection) {
		document.selection.empty()
	}
}

function removeItem(e) {
    autoSave.dirty()
	$(this).parent().remove()
}

function displayToolbar(item) {
	if (typeof item.currentTarget != 'undefined') {
		//called from an event handler no item given
		var item = this
	}
	var pos = $(item).offset()
	$('#toolbar').css('top', pos.top + 0)
	if (showHover) $('#toolbar').css('display','block')
	$(item).append($('#toolbar'))
	$('#color-button').removeClass('active')
}

function saveFail(a,b,c) {
    console.log('save failed',a,b,c)
}

function updateSave() {
    messenger.complete()
}

function save() {
    messenger.update('Saving changes...')
    messenger.updates = 1
    var list = window.location.href.split('/').pop()
    console.log(list, typeof list)
    var url = '/save/public/' + list
    console.log(url, typeof url)
    $.ajax({
        type: 'POST',
        data: {data:serialize()},
        url: url,
        success: updateSave,
        error: saveFail
    })
}

function serialize() {
	var columns = $('.list')
	var page = {}
	columns.each(function (index, list) {
		var col = $(list).parent().attr('class').replace(/ |column|ui-sortable/g,'')
		if (typeof page['column' + col] == 'undefined') page['column' + col] = {}
		page['column' + col]['list-' + index] = {
			header:$(list).children('h1').text(),
			cls: $(list).attr('class').replace('list',''),
			type: 'ul',
			items:[]
		}
		$(list).children('ul,ol').children('li').children('div').each(function (idx, item) {
			if ($(item).parents('ol').length) {
				page['column' + col]['list-' + index].type = 'ol'
			}
			page['column' + col]['list-' + index].items.push($(item).text())
		
		})
	})
    return JSON.stringify(page)
}

function removeList() {
    autoSave.dirty()
	$('#toolbar').css('display','none')
	var list = $('#toolbar').parent()
	$(document.body).append($('#toolbar'))
	list.remove()
	return false;
}

function displayColorList() {
	$(this).parent().toggleClass('active')
	return false;
}

function setListColor() {
    autoSave.dirty()
	var list = $(this).parents('.list')
	list.css('color','')
	var currentClass = list.attr('class').match(/[a-z0-9-]*-text/)
	if (currentClass != null) {
		list.removeClass(currentClass[0])
	}
	var classes = $(this).attr('class')
	list.addClass(classes.match(/[a-z0-9-]*-background/)[0].replace('background','text'))
	$(this).parents('#color-button').toggleClass('active')
	return false
}

function setCustomColor() {
    autoSave.dirty()
	var colorInput = $(this).prev()
	var list = $(this).parents('.list')
	list.css('color',colorInput[0].value)
	var currentClass = list.attr('class').match(/[a-z0-9-]*-text/)
	if (currentClass != null) {
		list.removeClass(currentClass[0])
	}
	colorInput[0].value = ''
	$(this).parents('#color-button').toggleClass('active')
}

var showHover = true
$(document).ready(function() {
	$('.column').append('<li class="add-button"><a href="#" class="button blue">Create list!</a></li>')
	$('.add-button a').click(createList)
	$('.grid_4').hover(
		function() {if (showHover) $(this).addClass('hover')},
		function() {$(this).removeClass('hover')}
	)
	$('.column').sortable({
		connectWith: '.column',
		handle: 'h1',
		placeholder: 'placeholder',
		forcePlaceholderSize: true,
		forceHelperSize: true,
		revert: true,
		sort: resizeColumns,
		start: function (event, ui) {
			ui.placeholder.height($(ui.item).height())
			ui.placeholder.parents('.grid_4').removeClass('hover')
			showHover = false
			$('#toolbar').css('display','none')
		},
		stop: function (event, ui) {
			var add = ui.item.parent('.column').children('.add-button')
			add.appendTo(ui.item.parent('.column'))
			ui.item.parents('.grid_4').addClass('hover')
			showHover = true
			displayToolbar(ui.item)
			$('#toolbar').css('display','block')
		}
	})
	$('.workarea h1').attr('contentEditable', true)
	$('.workarea h1').live('keydown', editHeader)
	$('.list').live('mouseenter',displayToolbar)
	$('.list ul > li, .list ol > li').each(function(idx, el) {
		$(el).html('<span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">' + $(el).html()+ '</div>')
	})
	$('.list ul > li, .list ol > li').live('keydown', editListItem)
	$('.list ul > li, .list ol > li').live('blur', completeListEdit)
	$('.list ul, .list ol').sortable({handle:'span', revert:true})
	$('.list ul span, .list ol span').live('click', markItem)
	$('.list ul span, .list ol span').live('dblclick', removeItem)
	$('#delete-button').click(removeList)
	$('#color-button > a').click(displayColorList)
	$('.color-swatch').click(setListColor)
	$('#set-color').click(setCustomColor)
	$('.status').append('<a href="#" onclick="save();return false">Save</a><span id="status-message">Everthing is all good!</span>')
	window.setInterval(autoSave.save, 5000)
})
