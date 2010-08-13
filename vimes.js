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

function editListItem(e) {
	switch(e.which) {
		case 13: //up
			e.preventDefault()
			$(this).after('<li><span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">Hello</div></li>')

			var next = $(this).next().children('div').get(0)
			$(this).next().bind({'keydown':editListItem})
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

$(document).ready(function() {
	$('.column').sortable({
		connectWith: '.column',
		handle: 'h1',
		placeholder: 'placeholder',
		forcePlaceholderSize: true,
		forceHelperSize: true,
		revert: true,
		sort: resizeColumns,
		start: function (event, ui) {
			$(ui.placeholder).height($(ui.item).height())

		}
	})

	$('.list ul > li').each(function(idx, el) {
		$(el).html('<span class="handle">&nbsp;&nbsp;&nbsp;</span><div contentEditable="true">' + $(el).html()+ '</div>')
		$(el).bind ({
			'keydown': editListItem,
		})

	})
	$('.list ul').sortable({handle:'span', revert:true})
})
