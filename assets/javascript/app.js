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
	$('#rsvpForm').addClass('hidden');
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

$(document).ready(function() {
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
	
	$('#searchForm').on('submit', function(event) {
		$('.results-table-wrapper, .apiError').hide();
		$('.no-results').addClass('hidden');
		event.preventDefault();
		$('#results').removeClass('hidden');
		var band = $('#bandName').val().trim();
		if (band.length) {
			$.ajax('http://api.songkick.com/api/3.0/search/artists.json?apikey=' + apiKey + '&query=' + encodeURIComponent(band))
				.done(function (response) {
					$('#resultsTable > tbody').empty();
					if (response.resultsPage.results.artist) {
						var touringArtistIds = [];
						for (var i=0; i < response.resultsPage.results.artist.length; i++){
							if (response.resultsPage.results.artist[i].onTourUntil != null) {
								touringArtistIds.push(response.resultsPage.results.artist[i].id);
							}
						}
						for (var j=0; j < touringArtistIds.length; j++) {
							$.ajax('http://api.songkick.com/api/3.0/artists/' + touringArtistIds[j] + '/calendar.json?apikey=' + apiKey)
								.done(function (calResponse) {
									var events = calResponse.resultsPage.results.event;
									if(events.length) {
										for (var k=0; k < events.length; k++) {
											//loop through events
											var curEvent = events[k];
											var dateFormat = curEvent.start.datetime == null ? 
												moment(curEvent.start.date).format('M/D/YYYY') :
												moment(curEvent.start.datetime).format('M/D/YYYY @ h:mma');
											var lineup = '';
											var location = curEvent.location.city;
	
											for (var l=0; l < curEvent.performance.length; l++) {
												if (curEvent.performance.length > 5) {
													lineup += curEvent.performance[l].artist.displayName;
													if (l <= 3 ) {
														lineup += ', ';
													}
													if (l > 3) {
														lineup += ' (and more!)';
														break;
													}
												} else {
													lineup += curEvent.performance[l].artist.displayName;
													if (l < curEvent.performance.length - 1 ) {
														lineup += ', ';
													}
												}
											}
	
											var tr = $('<tr><td width="250">' + lineup + '</td><td>' + dateFormat  + '</td><td>' + curEvent.venue.displayName + '</td><td>' + location + '</td>');
											
											var rsvpCell = $('<td>');
											var rsvpButton = $('<button>');
											rsvpButton.addClass('rsvp btn btn-rsvp');
											rsvpButton.attr('data-id', curEvent.id)
												.attr('data-uri', curEvent.uri)
												.attr('data-lineup', lineup)
												.attr('data-date', curEvent.start.datetime == null ? curEvent.start.date : curEvent.start.datetime)
												.attr('data-venue-id', curEvent.venue.id)
												.attr('data-venue', curEvent.venue.displayName)
												.attr('data-city', curEvent.venue.metroArea.displayName)
												.attr('data-state', curEvent.venue.metroArea.state !== undefined ? curEvent.venue.metroArea.state.displayName : '')
												.attr('data-country', curEvent.venue.metroArea.country.displayName)
												.attr('data-target', '#rsvpModal')
												.text('RSVP');
						
											// if user is not logged in, add the tooltip stuff
											if($('.user-info').text().length === 0) {
												rsvpButton.attr('data-placement', 'top')
													.attr('rel', 'tooltip')
													.attr('title', 'You must be signed in to RSVP');
											}
													
											$('#resultsTable > tbody').append(tr.append(rsvpCell.append(rsvpButton)));
											$('.results-table-wrapper').slideDown(200);
										}								
									} else {
										$('.no-results').removeClass('hidden');
									}
								})
								.fail(function(error) {
									$('#results').append('<p class="apiError">An error occurred while retrieving event data from the API :(');
								});
						}
					} else {
						$('.no-results').removeClass('hidden');
					}
				})
				.fail(function (error) {
					$('#results').append('<p class="apiError">An error occurred while retrieving artist data from the API :(');
				});
		} 
		$('#bandName').val('');
	});

	$('#rsvpModal').on('show.bs.modal', function (event) {
		$('#rsvpForm').removeClass('hidden');
		$('#alreadyRSVPed').addClass('hidden');
		$('#onRSVP').addClass('hidden');
		var button = $(event.relatedTarget);
		var street, zip;
		$.ajax('http://api.songkick.com/api/3.0/venues/' + button.data('venue-id') + '.json?apikey=' + apiKey)
			.done(function (response) {
				street = response.resultsPage.results.venue.street;
				zip = response.resultsPage.results.venue.zip;

				modal.find('#rsvpStreet').text(street);
				modal.find('#rsvpZip').text(zip);
			})
			.fail(function(error) {
				$('#results').append('<p class="apiError">An error occurred while retrieving event data from the API :(');
			});
		var id = button.data('id');
		var uri = button.data('uri');
		var lineup = button.data('lineup');
		var showDate = button.data('date');
		var venue = button.data('venue');
		var city = button.data('city');
		var state = button.data('state');
		var country = button.data('country');
		var modal = $(this);
		modal.find('#eventId').val(id);
		modal.find('#eventUri').val(uri);
		modal.find('#datetime').val(moment(showDate).format('X'));
		//get number of RSVPs for each event, and append it to the td
						
		database.ref('/rsvps').orderByChild('uid').equalTo(userId).once('value', function(snapshot) {
			if(snapshot.val()) {
				snapshot.forEach(function(child) {
					if (child.val().eventId == id.toString()) {
						$('#rsvpForm').addClass('hidden');
						$('#alreadyRSVPed').removeClass('hidden');
					}
				});
			}
		});

		modal.find('#rsvpLineup').text(lineup);
		if(moment(showDate).format('h:mma') == '12:00am') {
			modal.find('#rsvpShowDate').text(moment(showDate).format('M/D/YYYY'));
		} else {
			modal.find('#rsvpShowDate').text(moment(showDate).format('M/D/YYYY @ h:mma'));
		}
		modal.find('#rsvpShowVenue').text(venue);
		modal.find('#rsvpCity').text(city);
		if(state.length) {
			modal.find('#rsvpState').text(', ' + state);
		} else {
			modal.find('#rsvpState').empty();
		}
		modal.find('#rsvpCountry').text(country);
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
