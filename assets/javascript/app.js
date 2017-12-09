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
	usersRef.child(userId).set({
		name: currentUser.displayName,
		email: currentUser.email,
		photoUrl: currentUser.photoURL
	});
	var alreadyRsvped = false;
	rsvpsRef.orderByChild('uid').equalTo(userId).once('value', function(snapshot) {
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

function getEventInfo(eventId, fn) {
	$.ajax('https://api.songkick.com/api/3.0/events/' + eventId + '.json?apikey=' + apiKey)
		.done(function (eventResponse) {
			var curEvent = eventResponse.resultsPage.results.event;

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
			eventDivBody.html('<h4>Performer(s)</h4><p>' + lineup + '</p><h4>Date &amp; Time</h4><p>' + dateFormat + '</p><h4>Venue</h4><p>' + venue + '</p><h4>Location</h4><p>' + location + '</p>');

			//var rsvpCell = $('<td>');
			var rsvpButton = $('<button>');
			rsvpButton.addClass('rsvp btn-rsvp');
			rsvpButton.attr('data-id', curEvent.id)
				.attr('data-venue-website', curEvent.venue.website)
				.attr('data-event-title', curEvent.displayName.replace('Unknown venue', 'TBA'))
				.attr('data-lineup', lineup)
				.attr('data-date', curEvent.start.datetime == null ? curEvent.start.date : curEvent.start.datetime)
				.attr('data-venue-id', curEvent.venue.id)
				.attr('data-venue-name', curEvent.venue.displayName)
				.attr('data-venue-street', curEvent.venue.street)
				.attr('data-venue-city', curEvent.venue.city ? curEvent.venue.city.displayName : curEvent.venue.metroArea.displayName)
				.attr('data-state', curEvent.venue.metroArea.state == undefined ? '' : curEvent.venue.metroArea.state.displayName)
				.attr('data-zip', curEvent.venue.zip ? curEvent.venue.zip : '')
				.attr('data-country', curEvent.venue.city ? curEvent.venue.city.country.displayName :  curEvent.venue.metroArea.country.displayName)
				.attr('data-age', curEvent.ageRestriction ? curEvent.ageRestriction : 'None')
				.attr('data-target', '#rsvpModal')
				.text('More Info / RSVP');
		
			// if user is not logged in, add the tooltip stuff
			if($('.user-info').text().length === 0) {
				rsvpButton.attr('data-placement', 'top')
					.attr('rel', 'tooltip')
					.attr('title', 'You must be signed in to RSVP');
			}

			var viewRsvpsButton = $('<button id="viewRsvp-' + curEvent.id +'" class="btn-rsvp hidden">').attr('onClick', 'location.href=\'view-rsvps.html?event=' + curEvent.id + '\'')
				.text('View RSVPs for This Event');
			$('#events').append(eventDiv.append(eventDivHeader.append(eventDivTitle)).append(eventDivBody.append(rsvpButton).append(viewRsvpsButton)));
		
			$('#containerHead, #results').removeClass('hidden');
			
			fn(eventId);
		})
		.fail(function(error) {
			$('#results').append('<p class="apiError">An error occurred while retrieving event data from the API :(');
		});
}

$(document).ready(function() {
	// initialize all tooltips
	$('body').tooltip({
		selector: '[rel=tooltip]'
	});

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
											//loop through events
												var curEventId = events[k].id;
												getEventInfo(curEventId, function(curEventId) {
													rsvpsRef.orderByChild('eventId').equalTo(curEventId.toString()).once('value', function(snapshot) {
														if(snapshot.val()) {
															$('#viewRsvp-' + curEventId).removeClass('hidden');
														}
													});
												});
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

	$('#rsvpModal').on('show.bs.modal', function (event) {
		$('#rsvp-container, #rsvpSubmit').removeClass('hidden');
		$('#alreadyRSVPed, #onRSVP').addClass('hidden');
		var button = $(event.relatedTarget);
		var venueId = button.data('venue-id');
		var venueName = button.data('venue-name');
		var venueWebsite = button.data('venue-website');
		var street, zip, city, country;
		if (venueId) {
			street = button.data('venue-street');
			zip = button.data('zip');
			city = button.data('venue-city');
			state = button.data('state');
			country = button.data('country');
			venueName = button.data('venue-name');
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

		var id = button.data('id');
		var uri = button.data('uri');
		var title = button.data('event-title');
		var lineup = button.data('lineup');
		var showDate = button.data('date');
		var state = button.data('state');
		var age = button.data('age');
		var modal = $(this);
		$('#ageRestriction').text(age);
		if(venueWebsite) {
			$('#venue-website').html('<a href="' + venueWebsite + '" target="_blank">Venue website</a>');
		} else {
			$('#venue-website').empty();
		}
		modal.find('#eventId').val(id);
		modal.find('#eventUri').val(uri);
		modal.find('#rsvpTitle').text(title);
		modal.find('#datetime').val(moment(showDate).format('X'));
						
		database.ref('/rsvps').orderByChild('uid').equalTo(userId).once('value', function(snapshot) {
			if(snapshot.val()) {
				snapshot.forEach(function(child) {
					if (child.val().eventId == id.toString()) {
						$('#rsvp-container, #rsvpSubmit').addClass('hidden');
						$('#alreadyRSVPed').removeClass('hidden');
					}
				});
			}
		});

		modal.find('#rsvpLineup').text(lineup);
		if(moment(showDate).format('h:mma') == '12:00am') {
			modal.find('#rsvpShowDate').text(moment(showDate).format('M/D/YYYY') + ' (Time Not Specified)');
		} else {
			modal.find('#rsvpShowDate').text(moment(showDate).format('M/D/YYYY @ h:mma'));
		}
	});

	$('#cancelRsvp').on('click', function () {
		$('.ql-editor > p').empty();
		$('.ql-editor').addClass('ql-blank');
	});

	const maxRsvpChars = 280;
	editor.on('text-change', function (delta, old, source) {
		if (editor.getLength() > maxRsvpChars) {
			editor.deleteText(maxRsvpChars, editor.getLength());
		}
		$('#charsLeft').text(maxRsvpChars - editor.getLength() + 1);
	});

	$('#rsvpForm').on('submit', function (event) {
		event.preventDefault();
		//Add Event (if necessary) and RSVP to Firebase
		var eventId = $('#eventId').val();
		var message = $('.ql-editor').html();

		checkForRsvp(eventId, message, function(eventId, message) {
			database.ref('/rsvps').push({
				uid: userId,
				eventId: eventId,
				message: message
			}, function(errors) {
				if (!errors) {
					onRsvp();
				}
			});
		});
	});
});
