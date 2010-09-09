//Focus code found and based on:
//http://stackoverflow.com/questions/2871081/jquery-setting-cursor-posistion-in-contenteditable-div
focusEditable = function(el,collapse) {
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
	switch(e.which) {
		case 13:
			e.preventDefault()
	}
}
function completeListEdit() {
	if ($(this).text().replace(/\W+/g,'') == "") {
		$(this).remove()
	}
}
function editListItem(e) {
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
	console.log('marked!')
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
function displayToolbar() {
	a = this
	var header = $(this).children('h1')
	var pos = header.offset()
	var h = header.height() - 5
	$('#toolbar').css({'left': pos.left, 'top':pos.top + h,'position':'absolute'})
}
function hideToolbar() {}

showHover = true
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
		},
		stop: function (event, ui) {
			var add = ui.item.parent('.column').children('.add-button')
			add.appendTo(ui.item.parent('.column'))
			ui.item.parents('.grid_4').addClass('hover')
			showHover = true
		}
	})
	$('.workarea h1').attr('contentEditable', true)
	$('.workarea h1').live('keydown', editHeader)
	$('.list').hover(displayToolbar, hideToolbar)
	$('.list ul > li, .list ol > li').each(function(idx, el) {
		$(el).html('<span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">' + $(el).html()+ '</div>')

	})
	$('.list ul > li, .list ol > li').live('keydown', editListItem)
	$('.list ul > li, .list ol > li').live('blur', completeListEdit)
	$('.list ul, .list ol').sortable({handle:'span', revert:true})
	$('.list ul span, .list ol span').live('click', markItem)
})
