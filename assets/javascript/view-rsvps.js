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

function buildMyItem(title, timestamp, message, index) {		
	var rsvpTime = moment.unix(timestamp).format('M/DD/YYYY @ h:mma');

	var rsvpItem = $('<li>').attr('id', 'rsvp-' + index).addClass('rsvp-item');
	var eventTitle = $('<h3>').text(title);
	var msgDiv = $('<div>').html(message);
	var timestampDiv = $('<div class="timestamp" />');
	var rsvpTimestamp = $('<em>').text(rsvpTime);

	$('.rsvp-list').append(rsvpItem.append(eventTitle).append(msgDiv).append(timestampDiv.append(rsvpTimestamp)));

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
		database.ref('/users/' + userId + '/user-rsvps').once('value', function(snapshot) {
			const userData = snapshot.val();
			if(userData) {
				snapshot.forEach(function(child) {
					database.ref('/events').orderByChild('eventId').equalTo(child.val().eventId.toString()).once('value', function(eventSnap) {
						if (eventSnap.val()) {
							eventSnap.forEach(function(eventChild) {
								buildMyItem(eventChild.val().eventTitle, child.val().timestamp, child.val().message, $('.rsvp-item').length);
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
	$('body').niceScroll({
		cursorwidth:12,
		cursorcolor:'#000000',
		cursorborder:'1px solid #fff',
		horizrailenabled:false,
		autohidemode:false
	});
	var eventId = $.urlParam('eventId');
	getEventInfo(eventId);
});