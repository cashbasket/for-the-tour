var currentUser, userId;
var columnLefts = [];
var lastInColHeight, lastInColTop, left, colWidth, numCols;
const gutterWidth = 15;

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		currentUser = firebase.auth().currentUser;
		userId = currentUser.uid;
	} else {
		currentUser = '';
		userId = '';
	}
});

var database = firebase.database();

$.urlParam = function(name, url) {
	if (!url) {
		url = window.location.href;
	}
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
	if (!results) { 
		return undefined;
	}
	return results[1] || undefined;
};

function getEventInfo(eventId) {
	if(eventId !== undefined) {
		database.ref('/events').orderByChild('eventId').equalTo(eventId).once('value', function(eventSnap) {
			if (eventSnap.val()) {
				eventSnap.forEach(function(eventChild) {
					var eventTitle = eventChild.val().eventTitle;
					var eventHeader = $('<h2>').text('RSVPs for ' + eventTitle);
					$('.event-detail-header').removeClass('hidden').append(eventHeader);
				});
			}
		});  
	}
}

function setColumns(width) {	
	if (width >= 768)
		numCols = 3;
	else if (width >= 480)
		numCols = 2;
	else
		numCols = 1;
	
	colWidth = ((width - (gutterWidth * (numCols - 1))) / numCols);
	columnLefts = [];
	for(var i = 0; i < numCols; i++) {
		columnLefts.push((colWidth + gutterWidth) * i);
	}
}

function buildMyItem(eventId, title, timestamp, message, index) {		
	var rsvpTime = moment.unix(timestamp).format('M/DD/YYYY @ h:mma');

	var rsvpItem = $('<li>').attr('id', 'rsvp-' + index).addClass('rsvp-item');
	var eventTitle = $('<strong class="my-rsvp-title">').text(title);
	var editAnchor = $('<a>').attr('href', 'javascript:void(0);')
		.attr('id', 'edit-' + eventId)
		.attr('data-id', eventId)
		.attr('data-title', title)
		.addClass('edit-rsvp')
		.attr('data-text', message)
		.attr('data-target', '#rsvpModal');
	var editIconDiv = $('<div>').addClass('edit-icon-div pull-right');
	var editIcon = $('<i class="fas fa-edit">').attr('id', 'edit-' + eventId);
	var msgDiv = $('<div>').attr('id', 'rsvpText-' + eventId).addClass('rsvp-text').html(message);
	var timestampDiv = $('<div class="timestamp" />');
	var rsvpTimestamp = $('<em>').attr('id', 'timestamp-' + eventId).text(rsvpTime);

	$('.rsvp-list').append(rsvpItem.append(editIconDiv.append(editAnchor.append(editIcon))).append(eventTitle).append(msgDiv).append(timestampDiv.append(rsvpTimestamp)));

	positionItem(index);
}

function buildItem(name, photo, timestamp, message, index) {
	var rsvpTime = moment.unix(timestamp).format('MM/DD/YYYY @ h:mma');	
	var rsvpItem = $('<li>').attr('id', 'rsvp-' + index).addClass('rsvp-item');
	var userName = $('<h3>').text(name);
	var userPhoto = $('<img />').attr('src', photo).addClass('rsvp-img pull-right');
	var timestampDiv = $('<div class="timestamp" />');
	var rsvpTimestamp = $('<em>').text(rsvpTime);
	$('.rsvp-list').append(rsvpItem.append(userPhoto).append(userName).append(message).append(timestampDiv.append(rsvpTimestamp)));

	positionItem(index);
}

function positionItem(index) {
	// this determines the value of the "left" css property to be used (see global "columnLefts" array)
	left = columnLefts[index % numCols];
	
	if(index > numCols - 1) {
		// find height of last item in same column as item to be updated
		lastInColHeight = $('#rsvp-' + (index - numCols)).outerHeight(true);
		// find "top" css value of last item in same column as item to be updated
		lastInColTop = $('#rsvp-' + (index - numCols)).css('top').split('p')[0];
		// append "style" HTML attribute to item to position it properly
		$('#rsvp-' + index).attr('style', 'width: ' + colWidth + 'px; position: absolute; left: ' + left + 'px; top: ' + (parseInt(lastInColHeight) + parseInt(lastInColTop) + gutterWidth + 'px'));
	} else {
		lastInColHeight = $('#rsvp-' + index).outerHeight(true);
		lastInColTop = 0;
		$('#rsvp-' + index).attr('style', 'width: ' + colWidth + 'px; position: absolute; left: ' + left + 'px; top: ' + parseInt(lastInColTop) + 'px');
	}
}

function viewRsvps(eventId) {
	if(eventId === undefined) {
		// MY RSVPS
		database.ref('/users/' + userId + '/user-rsvps').on('value', function(snapshot) {
			const userData = snapshot.val();
			if(userData) {
				snapshot.forEach(function(child) {
					database.ref('/events').orderByChild('eventId').equalTo(child.val().eventId.toString()).on('value', function(eventSnap) {
						if (eventSnap.val()) {
							eventSnap.forEach(function(eventChild) {
								buildMyItem(child.val().eventId.toString(), eventChild.val().eventTitle, child.val().timestamp, child.val().message, $('.rsvp-item').length);
							});
						}
					});                    
				});
			}
		});
	} else {
		// EVENT RSVPS
		database.ref('/rsvps').orderByChild('eventId').equalTo(eventId.toString()).on('child_added', function(snapshot) {
			if(snapshot.val()) {
				database.ref('/users/' + snapshot.val().uid).once('value', function(userSnap) {
					if (userSnap.val()) {
						var message = snapshot.val().message != '<p><br></p>' ? snapshot.val().message : '<p><em>(This person is no fun and didn\'t leave a message.)</em></p>';
						buildItem(userSnap.val().name, userSnap.val().photoUrl, snapshot.val().timestamp, message, $('.rsvp-item').length);
					}
				});
			}
		});
	}
}

$(document).ready(function() {
	var eventId = $.urlParam('eventId');
	var oldURL = document.referrer;

	if(eventId) {
		getEventInfo(eventId);
		
		setColumns($('.rsvp-results').width());
		$(window).on('resize', function() {	
			setColumns($('.rsvp-results').width());
			for (var i = 0; i < $('.rsvp-item').length; i++) {
				//reposition item
				positionItem(i);
			}
		});
		if (oldURL.indexOf('search.html') > 0) {
			$('.last-search').html('<a href="' + oldURL + '">&laquo; Back to Search Results</a>');
		}
		$('.rsvp-list').empty();
		viewRsvps(eventId);    
	} else {
		var editor = new Quill('#messageText', {
			modules: {
				toolbar: [
					['bold', 'italic'],
					['link', 'blockquote'],
					[{ list: 'ordered' }, { list: 'bullet' }]
				]
			},
			placeholder: 'Type something cool...',
			theme: 'snow'
		});
		const maxRsvpChars = 280;
		editor.on('text-change', function () {
			if (editor.getLength() > maxRsvpChars) {
				editor.deleteText(maxRsvpChars, editor.getLength());
			}
			$('#charsLeft').text(maxRsvpChars - editor.getLength() + 1);
			if(editor.getLength() > 200) {
				$('#charsLeft').addClass('red');
			} else {
				$('#charsLeft').removeClass('red');
			}
		});
		$('#charsLeft').text(maxRsvpChars - editor.getLength() + 1);
		$('body').on('click', '.edit-rsvp', function() {
			$('.ql-editor').html($(this).attr('data-text'));
			$('#eventTitle').text($(this).attr('data-title'));
			$('#eventId').val($(this).data('id'));
			$('#editSuccess, .rsvp-warning, .rsvp-no-edits').addClass('hidden');
			$('#rsvp-container, #rsvpSubmit').removeClass('hidden');
			$('#rsvpModal').modal({backdrop: 'static', keyboard: false}, $(this));
		});
		$('#rsvpEditForm').on('submit', function(event) {
			event.preventDefault();
			var message = $('.ql-editor').html().replace('ql-indent-1', 'indent-1').replace('ql-indent-2', 'indent-2');
			if(message === '<p><br></p>') {
				// Let user know a message is required.
				$('.rsvp-warning').removeClass('hidden');
				$('.rsvp-no-edits').addClass('hidden');
			} else if (message === $('#edit-' + $('#eventId').val()).attr('data-text')) {
				$('.rsvp-warning').addClass('hidden');
				$('.rsvp-no-edits').removeClass('hidden');
			} else {
				database.ref('/users/' + userId + '/user-rsvps').orderByChild('eventId').equalTo($('#eventId').val()).once('value', function(eventSnap) {
					if (eventSnap.val()) {
						var key = Object.keys(eventSnap.val())[0];
						database.ref('/users/' + userId + '/user-rsvps/').child(key).update({
							message: message,
							timestamp: moment().format('X')
						}, function(error) {
							if (!error) {
								$('#editSuccess').removeClass('hidden').delay(5000).fadeOut(3000);
								$('#rsvpText-' + $('#eventId').val()).html(message);
								$('#timestamp-' + $('#eventId').val()).text(moment().format('M/D/YYYY @ h:mma'));
								$('#edit-' + $('#eventId').val()).attr('data-text', message);
								for(var i=0; i < $('.rsvp-item').length - 1; i++) {
									positionItem(i);
								}
							}
						});
					}	
				});
				database.ref('/rsvps').orderByChild('eventId').equalTo($('#eventId').val().toString()).once('value', function(eventSnap) {
					if (eventSnap.val()) {
						eventSnap.forEach(function(childSnap) {
							if(childSnap.val().uid === userId) {
								database.ref('/rsvps/' + childSnap.key).update({
									message: message,
									timestamp: moment().format('X')
								});
							}
						});
					}	
				});
			}
		});
	}
	$('body').on('click', '.sign-out', function() {
		signOut();
		$('.rsvp-list').empty();
	});
});
