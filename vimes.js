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

function highlightListItem(event) {}
function unhighlightListItem(event) {}

var editItems = []

function editComplete(item) {
	item.parent().removeClass('current-edit-item')
	item.parent().text(item.attr('value'))
}

function editItem(event) {
	if ($(this).hasClass('current-edit-item')) { return }
	$.each(editItems, function(idx, value) { editComplete(value)})
	$(this).addClass('current-edit-item')
	var value = $(this).text()	
	var input = $("<input type='text' value='" + value + "'>")
	$(this).html("")
	input.appendTo($(this))
	input.focus()
	editItems[editItems.length] = input
}

$(document).ready(function() {
	$(".list-area li").each(function(index) {
		$(this).bind({
			mouseover: highlightListItem,
			mouseout: unhighlightListItem,
			click: editItem
		})
	})
	$(".list-area h1").each(function(index) {
		$(this).bind({
			mouseover: highlightListItem,
			mouseout: unhighlightListItem,
			click: editItem
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
