function addItem(event) {
	var item = $('<li>New Item</li>')
	item.bind({
		mouseover: highlightListItem,
		mouseout: unhighlightListItem,
		click: editItem
	})
	item.insertBefore(this)
	item.triggerHandler('click')
}

currentItem = null
function highlightListItem(event) {
	var tools = $('#itemToolTray')
	var pos = $(this).position()
	var width = $(this).width()
	pos.left += width
	pos.position = 'absolute'
	console.log(pos)
	tools.css(pos)
	currentItem = this
}
function unhighlightListItem(event) {}

var editItems = []

function editComplete(item) {
	item.parent().removeClass('current-edit-item')
	item.parent().text(item.attr('value'))
}

function editItem(item) {
	console.log('edit', item)
	if ($(item).hasClass('current-edit-item')) { return }
	$.each(editItems, function(idx, value) { editComplete(value)})
	$(item).addClass('current-edit-item')
	var value = $(item).text()	
	var input = $("<input type='text' value='" + value + "'>")
	$(item).html("")
	input.appendTo($(item))
	input.focus()
	editItems[editItems.length] = input
}

$(document).ready(function() {
	$('#editItem').click(function() {editItem(currentItem)})
	$(".list-area li").each(function(index) {
		$(this).bind({
			mouseover: highlightListItem,
			mouseout: unhighlightListItem,
		})
	})
	$(".list-area h1").each(function(index) {
		$(this).bind({
			mouseover: highlightListItem,
			mouseout: unhighlightListItem,
		})
	})
	$(".list-area ul").each(function(index) {
		var add = $('<li class="create-item">Add Item</li>')
		add.click(addItem)
		add.appendTo(this)
		$(this).bind({
			mouseover: function() {$(this).addClass("current-list")},
			mouseout: function() {$(this).removeClass("current-list")}
		})
	})


})
