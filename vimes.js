function updateList(e) {
	var text = this.value
	$('#list').html('<li>' + text.replace(/\n/g,"<li>"))
}

function editList() {
	var list = $(this).prev()
	var position = $('#list').offset()
	var editor = $('#listEditor')
	list.addClass('editing')
	editor.html(list.html().replace("<li>","").replace(/\s+/g," ").replace(/<li>/g, "\n").replace(/<\/li>/g, ""))
	$('#listEditor').css({
		left: position.left+ 28,
		top: position.top - 2,
		display: 'block',
		position: 'fixed',
		width: list.children().first().outerWidth()
	})
	$('#listEditor').focus()

}



function completeEdit() {
	var text = this.value
	$('#list').html('<li>' + text.replace(/\n/g,"<li>"))
	$(this).css('display','none')
}

function resizeColumns(e, ui) {
	var minHeight = 0
	$('.column').each(function (idx, col) {
		$('.column').css('min-height', 0)
		var h = $(col).height()
		console.log(h)
		minHeight = (h > minHeight) ? h : minHeight
	})
	console.log('min-height',minHeight)
	$('.column').css('minHeight',minHeight)
}

$(document).ready(function() {
	$('.edit-link').bind('click', editList)
	$('#listEditor').bind('keyup', updateList)
	$('#listEditor').bind('blur', completeEdit)
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


})
