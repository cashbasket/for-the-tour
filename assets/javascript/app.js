var apiKey = 'QHUtsj2TFotzVJpp';
var currentUser, userId;
var database = firebase.database();
var rsvpsRef = database.ref('/rsvps/');
var usersRef = database.ref('/users');

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		currentUser = firebase.auth().currentUser;
		userId = currentUser.uid;
	} else {
		currentUser = '';
		userId = '';
	}
});

function onRsvp() {
	//if the RSVP was successfully added, do stuff
	$('#rsvp-container, #rsvpSubmit').addClass('hidden');
	$('#onRSVP').removeClass('hidden');
	$('.ql-editor > p').empty();
	$('.ql-editor').addClass('ql-blank');
}

function checkForRsvp(eventId, message, fn) {
	usersRef.once('value', function(snapshot) {
		if (!snapshot.child(userId).exists()) {
			usersRef.child(userId).set({
				name: currentUser.displayName,
				email: currentUser.email,
				photoUrl: currentUser.photoURL
			});
		}
		var alreadyRsvped = false;
		database.ref('/users/' + userId + '/user-rsvps').once('value', function(snapshot) {
			const userData = snapshot.val();
			if(userData) {
				snapshot.forEach(function(child) {
					if (child.val().eventId == eventId) {
						alreadyRsvped = true;
					}
				});
			}
			if (!alreadyRsvped) {
				fn(eventId, message);
			}
		});
	});
}

function getArtistEvent(curEvent, fn) {
	var dateFormat = curEvent.start.datetime == null ? 
		moment(curEvent.start.date).format('M/D/YYYY') :
		moment(curEvent.start.datetime).format('M/D/YYYY @ h:mma');
	var lineup = '';
	var location = curEvent.location.city;
	var venue = curEvent.venue.displayName !== 'Unknown venue'? curEvent.venue.displayName : 'N/A';

	for (var l=0; l < curEvent.performance.length; l++) {
		lineup += curEvent.performance[l].artist.displayName;
		if (l < curEvent.performance.length - 1 ) {
			lineup += ', ';
		}
	}

	var eventDiv = $('<div class="panel panel-event event">');
	var eventDivHeader = $('<div class="panel-heading">');
	var eventDivTitle = $('<h3 class="panel-title">').text(curEvent.displayName.replace('Unknown venue', 'TBA'));
	var eventDivBody = $('<div class="panel-body">');
	var eventDivRow = $('<div class="row">');
	var detailsCol = $('<div class="col-md-7">');
	var rsvpsCol = $('<div class="col-md-5 hidden rsvp-column">').attr('id', 'rsvpCol-' + curEvent.id);
	var detailsDiv = $('<div class="event-details">');
	var rsvpsDiv = $('<div id="rsvp-' + curEvent.id + '" class="event-rsvps">');
	detailsDiv.html('<h4>Date &amp; Time</h4><p>' + dateFormat + '</p><h4>Venue</h4><p>' + venue + '</p><h4>Location</h4><p>' + location + '</p>');

	var rsvpButton = $('<button>');
	rsvpButton.addClass('rsvp btn-rsvp');
	rsvpButton.attr('data-id', curEvent.id)
		.attr('data-venue-website', curEvent.venue.website)
		.attr('data-event-title', curEvent.displayName.replace('Unknown venue', 'TBA'))
		.attr('data-lineup', lineup)
		.attr('data-date', curEvent.start.datetime == null ? curEvent.start.date : curEvent.start.datetime)
		.attr('data-venue-id', curEvent.venue.id)
		.attr('data-venue-name', curEvent.venue.displayName)
		.attr('data-state', curEvent.venue.metroArea.state ? curEvent.venue.metroArea.state.displayName : '')
		.attr('data-target', '#rsvpModal')
		.text('More Info / RSVP');

	var viewRsvpsButton = $('<button id="viewRsvp-' + curEvent.id +'" class="btn-rsvp hidden">').attr('onClick', 'location.href=\'view-rsvps.html?eventId=' + curEvent.id + '\'')
		.text('View RSVPs');
	$('#events').append(eventDiv.append(eventDivHeader.append(eventDivTitle)).append(eventDivBody.append(eventDivRow.append(detailsCol.append(detailsDiv.append(rsvpButton).append(viewRsvpsButton))).append(rsvpsCol.append(rsvpsDiv)))));

	var rsvpHeaderRow = $('<div class="row">');
	var rsvpHeaderCol = $('<div class="col-md-12 rsvp-header">');
	var rsvpHeader = $('<h4>').text('Recent RSVPs');
	$('#rsvpCol-' + curEvent.id).prepend(rsvpHeaderRow.append(rsvpHeaderCol.append(rsvpHeader)));

	fn(curEvent);
}

function getVenueInfo(button, fn) {
	var venueId = button.data('venue-id');
	$.ajax('https://api.songkick.com/api/3.0/venues/' + venueId + '.json?apikey=' + apiKey)
		.done(function (response) {
			var venue = response.resultsPage.results.venue;
			var venueName = venue.displayName;
			var venueWebsite = venue.website;
			var id = button.data('id');
			var uri = button.data('uri');
			var title = button.data('event-title');
			var lineup = button.data('lineup');
			var showDate = button.data('date');
			var state = button.data('state');
			var venueId = button.data('venue-id');
			var street, zip, city, country;
			if (venueId) {
				street = venue.street;
				zip = venue.zip;
				city = venue.city.displayName;
				country = venue.city.country.displayName;
				$('#rsvpStreet').text(street);
				$('#rsvpZip').text(zip);
				if (venueName !== 'Unknown venue') {
					$('#rsvpShowVenue').show();
				} else {
					venueName = '';
					$('#rsvpShowVenue').hide();
				}
				$('#rsvpShowVenue').text(venueName);
				$('#rsvpCity').text(city);
				if(state.length) {
					$('#rsvpState').text(', ' + state);
				} else {
					$('#rsvpState').empty();
				}
				$('#rsvpCountry').text(country);
			} else {
				$('#rsvpShowVenue').text('N/A');
				$('#rsvpStreet').empty();
				$('#rsvpZip').empty();
				$('#rsvpCity').empty();
				$('#rsvpState').empty();
				$('#rsvpCountry').empty();
			}		

			if(venueWebsite) {
				$('#venue-website').html('<i class="far fa-bookmark"></i> <a href="' + venueWebsite + '" target="_blank">Venue website</a>');
			} else {
				$('#venue-website').empty();
			}
	
			$('#eventId').val(id);
			$('#eventUri').val(uri);
			$('#rsvpTitle').text(title);
			$('#datetime').val(showDate);

			$('#rsvpLineup').text(lineup);
			if(moment(showDate).format('h:mma') == '12:00am') {
				$('#rsvpShowDate').text(moment(showDate).format('M/D/YYYY') + ' (Time Not Specified)');
			} else {
				$('#rsvpShowDate').text(moment(showDate).format('M/D/YYYY @ h:mma'));
			}

			fn();
		})
		.fail(function() {
			$('#results').append('<p class="apiError">An error occurred while retrieving event data from the API :(');
		});
}

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

function escapeRegExp(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

String.prototype.replaceAll = function(search, replacement) {
	var target = this;
	return target.replace(new RegExp(escapeRegExp(search), 'g'), replacement);
};

$(document).ready(function() {
	$('body').niceScroll({
		cursorwidth:12,
		cursorcolor:'#000000',
		cursorborder:'1px solid #fff',
		horizrailenabled:false,
		autohidemode:false
	});

	//initialize Quill.js
	if($('#messageText').length) {
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
	}

	var curInput = $.urlParam('b');
	if(curInput) {
		var band = decodeURIComponent(curInput.replaceAll('+', ' '));
		$('#result-header-query').text(band);
		$('#homeSearch, .no-results, #results, #containerHead').addClass('hidden');
		$('.searching').removeClass('hidden');
		$('#homepage').removeClass('hidden');
		$('.results-table-wrapper, .apiError').hide();
		$.ajax('https://api.songkick.com/api/3.0/search/artists.json?apikey=' + apiKey + '&query=' + encodeURIComponent(band))
			.done(function (response) {
				$('.searching').addClass('hidden');
				$('#events').empty();
				if (response.resultsPage.results.artist) {
					var touringArtistIds = [];
					for (var i=0; i < response.resultsPage.results.artist.length; i++){
						if (response.resultsPage.results.artist[i].onTourUntil != null) {
							touringArtistIds.push(response.resultsPage.results.artist[i].id);
						}
					}
					if (touringArtistIds.length) {
						for (var j=0; j < touringArtistIds.length; j++) {
							$.ajax('https://api.songkick.com/api/3.0/artists/' + touringArtistIds[j] + '/calendar.json?apikey=' + apiKey)
								.done(function (calResponse) {
									var events = calResponse.resultsPage.results.event;
									if(events.length) {
										for (var k=0; k < events.length; k++) {
											var curEvent = events[k];
											getArtistEvent(curEvent, function(curEvent) {
												var curEventId = curEvent.id;
												//resize main body nicescroll
												$('body').getNiceScroll().resize();
												rsvpsRef.orderByChild('eventId').equalTo(curEventId.toString()).limitToLast(10).on('child_added', function(snapshot, previousChildKey) {
													if(snapshot.val()) {
														$('#rsvpCol-' + curEventId).removeClass('hidden');
														var rsvpRow  = $('<div class="row rsvp-row ' + snapshot.key +'">');
														var rsvpCol = $('<div class="col-md-12">');
														var rsvpName, rsvpPhoto, message;
														var rsvpTimestamp = moment.unix(snapshot.val().timestamp).format('MM/DD/YYYY @ h:mma');
														var emptyRsvp = rsvpRow.append(rsvpCol);
														if(previousChildKey) {
															emptyRsvp.insertBefore('#rsvp-' + curEventId + ' > .' + previousChildKey);
														} else {
															$('#rsvp-' + curEventId).prepend(emptyRsvp);
														}
														database.ref('/users/' + snapshot.val().uid).once('value', function(userSnap) {
															if (userSnap.val()) {
																rsvpName = $('<strong>').text(userSnap.val().name);
																rsvpPhoto = $('<img>').attr('src', userSnap.val().photoUrl).addClass('rsvp-img pull-right');
																rsvpTimestamp = $('<em>').text(rsvpTimestamp);
																message = snapshot.val().message != '<p><br></p>' ? snapshot.val().message : '<p><em>(This person is no fun and didn\'t leave a message.)</em></p>';
																$('.' + snapshot.key + ' .col-md-12').append(rsvpPhoto).append(rsvpName).append('<br>').append(rsvpTimestamp).append(message);
																//initialize nicescroll on rsvp div
																$('#rsvp-' + curEventId).niceScroll({
																	cursorwidth:8,
																	cursorcolor:'#4c687c',
																	cursorborder:'none',
																	horizrailenabled:false,
																	autohidemode:'leave'
																});
																$('#rsvp-' + curEventId).getNiceScroll().resize();
															}
														});
														$('#viewRsvp-' + curEventId).removeClass('hidden');
													}
												});
											});	
											$('#containerHead, #results').removeClass('hidden');
										}								
									} else {
										$('#containerHead').removeClass('hidden');
										$('.no-results').removeClass('hidden');
									}
								})
								.fail(function() {
									$('#results').append('<p class="apiError">An error occurred while retrieving event data from the API :(');
								});
						}
					} else {
						$('#containerHead').removeClass('hidden');
						$('.no-results').removeClass('hidden');
					}
				} else {
					$('#containerHead').removeClass('hidden');
					$('.no-results').removeClass('hidden');
				}
			})
			.fail(function () {
				$('#results').append('<p class="apiError">An error occurred while retrieving artist data from the API :(');
			});
	} 
	$('#bandName, #subBandName').val('');

	$('body').on('click', '.rsvp', function() {
		$('#rsvpForm').addClass('hidden');
		$('#venueLoading').removeClass('hidden');
		$('#addToCalendarLink').removeClass('hidden');
		$('#alreadyRSVPed, #onRSVP, #eventAdded').addClass('hidden');
		var button = $(this);

		getVenueInfo(button, function() {
			$('#venueLoading').addClass('hidden');
			$('#rsvpForm').removeClass('hidden');
		});
						
		database.ref('/users/' + userId + '/user-rsvps').once('value', function(snapshot) {
			if ($('.user-info').text().length) {
				$('#rsvp-container, #rsvpSubmit').removeClass('hidden');
			}
			if(snapshot.val()) {
				snapshot.forEach(function(child) {
					if (child.val().eventId == button.data('id').toString()) {
						$('#rsvp-container, #rsvpSubmit').addClass('hidden');
						$('#alreadyRSVPed').removeClass('hidden');
					}
				});
			}
		});
		$('#rsvpModal').modal({backdrop: 'static', keyboard: false}, $(this));
	});

	$('#cancelRsvp').on('click', function () {
		$('.ql-editor').html('<p></p>');
		$('.ql-editor').addClass('ql-blank');
	});

	$('#rsvpForm').on('submit', function (event) {
		event.preventDefault();
		var eventId = $('#eventId').val();
		var message = $('.ql-editor').html().replace('ql-indent-1', 'indent-1').replace('ql-indent-2', 'indent-2');

		checkForRsvp(eventId, message, function(eventId, message) {
			var rsvp = {
				uid: userId,
				eventId: eventId,
				message: message,
				timestamp: moment().format('X')
			};
			// push rsvp to main rsvps node and user's personal rsvps sub-node
			database.ref('/rsvps').push(rsvp, function(errors) {
				database.ref('/users/' + userId + '/user-rsvps').push(rsvp, function() {
					if (!errors) {
						database.ref('/events').orderByChild('eventId').equalTo(eventId).once('value', function(snapshot) {
							if(!snapshot.val()) {
								var event = {
									eventId: eventId,
									eventTitle: $('#rsvpTitle').text(),
									eventStart: moment($('#datetime').val()).format('X')
								};
								database.ref('/events').push(event);
								$('#viewRsvp-' + eventId).removeClass('hidden');
							}
						});
						onRsvp();
					}
				});		
			});
		});
	});
});
