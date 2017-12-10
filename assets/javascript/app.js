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
	});
	
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
	var rsvpsCol = $('<div class="col-md-5 hidden">').attr('id', 'rsvpCol-' + curEvent.id);
	var detailsDiv = $('<div class="event-details">');
	var rsvpsDiv = $('<div id="rsvp-' + curEvent.id + '" class="event-rsvps">');
	var rsvpsHeader = $('<h3>').text('Recent RSVPs');
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

	var viewRsvpsButton = $('<button id="viewRsvp-' + curEvent.id +'" class="btn-rsvp hidden">').attr('onClick', 'location.href=\'view-rsvps.html?event=' + curEvent.id + '\'')
		.text('View RSVPs');
	$('#events').append(eventDiv.append(eventDivHeader.append(eventDivTitle)).append(eventDivBody.append(eventDivRow.append(detailsCol.append(detailsDiv.append(rsvpButton).append(viewRsvpsButton))).append(rsvpsCol.append(rsvpsDiv.append(rsvpsHeader))))));

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
		.fail(function(error) {
			$('#results').append('<p class="apiError">An error occurred while retrieving event data from the API :(');
		});
}

$(document).ready(function() {
	//initialize Quill.js
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
	
	$('.searchForm').on('submit', function(event) {
		var curInput = $(this).find('.search-input');
		event.preventDefault();
		var band = curInput.val().trim();
		if (band.length) {
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
													rsvpsRef.orderByChild('eventId').equalTo(curEventId.toString()).limitToLast(10).on('value', function(snapshot) {
														if(snapshot.val()) {
															$('#rsvpCol-' + curEventId).removeClass('hidden');
															$('#no-results-' + curEventId).hide();
															$('#rsvp-' + curEventId).empty().append('<h3>Recent RSVPs</h3>');
															snapshot.forEach(function(childSnapshot) {
																var rsvpRow  = $('<div class="row rsvp-row">');
																var rsvpCol = $('<div class="col-md-12">');
																var rsvpName, rsvpPhoto;
																database.ref('/users/' + childSnapshot.val().uid).once('value', function(userSnap) {
																	if (userSnap.val()) {
																		rsvpName = $('<strong>').text(userSnap.val().name);
																		rsvpPhoto = $('<img>').attr('src', userSnap.val().photoUrl).addClass('rsvp-img pull-right');
																		var message = childSnapshot.val().message != '<p><br></p>' ? childSnapshot.val().message : '<p><em>(This person is no fun and didn\'t leave a message.)</em></p>';
																		$('#rsvp-' + curEventId).append(rsvpRow.append(rsvpCol.append(rsvpName).append(rsvpPhoto).append(message)));
																	}
																});
															});
															$('#viewRsvp-' + curEventId).removeClass('hidden');
														} else {
															$('#rsvp-' + curEventId).append('<p id="no-results-' + curEventId + '">There are currently no RSVPs for this event.');
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
									.fail(function(error) {
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
				.fail(function (error) {
					$('#results').append('<p class="apiError">An error occurred while retrieving artist data from the API :(');
				});
		} 
		$('#bandName, #subBandName').val('');
	});

	$('body').on('click', '.rsvp', function() {
		$('#rsvpForm').hide();
		$('#venueLoading').show();
		$('#addToCalendarLink').removeClass('hidden');
		$('#alreadyRSVPed, #onRSVP, #eventAdded').addClass('hidden');
		var button = $(this);

		getVenueInfo(button, function() {
			$('#venueLoading').hide();
			$('#rsvpForm').show();
			if ($('.user-info').text().length) {
				$('#rsvp-container, #rsvpSubmit').removeClass('hidden');
			}
		});
						
		database.ref('/users/' + userId + '/user-rsvps').once('value', function(snapshot) {
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

	const maxRsvpChars = 280;
	editor.on('text-change', function (delta, old, source) {
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

	$('#rsvpForm').on('submit', function (event) {
		event.preventDefault();
		var eventId = $('#eventId').val();
		var message = $('.ql-editor').html().replace('ql-indent-1', 'indent-1').replace('ql-indent-2', 'indent-2');

		checkForRsvp(eventId, message, function(eventId, message) {
			var rsvp = {
				uid: userId,
				eventId: eventId,
				message: message
			};
			// push rsvp to main rsvps node and user's personal rsvps sub-node
			database.ref('/rsvps').push(rsvp, function(errors) {
				database.ref('/users/' + userId + '/user-rsvps').push(rsvp, function() {
					if (!errors) {
						$('#viewRsvp-' + eventId).removeClass('hidden');
						onRsvp();
					}
				});		
			});
		});
	});
});
