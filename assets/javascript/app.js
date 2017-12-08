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
	
	$('.searchForm').on('submit', function(event) {
		var curInput = $(this).find('.search-input');
		event.preventDefault();
		var band = curInput.val().trim();
		if (band.length) {
			$('#homeSearch').addClass('hidden');
			$('#subSearch').removeClass('hidden');
			$('.results-table-wrapper, .apiError').hide();
			$('.no-results').addClass('hidden');
			$('#results, .searching').removeClass('hidden');
			$.ajax('http://api.songkick.com/api/3.0/search/artists.json?apikey=' + apiKey + '&query=' + encodeURIComponent(band))
				.done(function (response) {
					$('.searching').addClass('hidden');
					$('#resultsTable > tbody').empty();
					if (response.resultsPage.results.artist) {
						var touringArtistIds = [];
						for (var i=0; i < response.resultsPage.results.artist.length; i++){
							if (response.resultsPage.results.artist[i].onTourUntil != null) {
								touringArtistIds.push(response.resultsPage.results.artist[i].id);
							}
						}
						
						if (touringArtistIds.length) {
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
												var venue = curEvent.venue.displayName !== 'Unknown venue'? curEvent.venue.displayName : 'TBA';
	
												for (var l=0; l < curEvent.performance.length; l++) {
													if (curEvent.performance.length > 20) {
														lineup += curEvent.performance[l].artist.displayName;
														if (l <= 18 ) {
															lineup += ', ';
														}
														if (l > 18) {
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
	
												var tr = $('<tr><td class="eventTitle"><strong>' + curEvent.displayName.replace('Unknown venue', 'TBA') + '</strong></td><td class="eventLineup">' + lineup + '</td><td class="eventDateTime">' + dateFormat  + '</td><td>' + venue + '</td><td>' + location + '</td>');
											
												var rsvpCell = $('<td>');
												var rsvpButton = $('<button>');
												rsvpButton.addClass('rsvp btn btn-rsvp');
												rsvpButton.attr('data-id', curEvent.id)
													.attr('data-uri', curEvent.uri)
													.attr('data-title', curEvent.displayName.replace('Unknown venue', 'TBA'))
													.attr('data-lineup', lineup)
													.attr('data-date', curEvent.start.datetime == null ? curEvent.start.date : curEvent.start.datetime)
													.attr('data-venue-id', curEvent.venue.id)
													.attr('data-venue-name', curEvent.venue.displayname)
													.attr('data-state', curEvent.venue.metroArea.state == undefined ? '' : curEvent.venue.metroArea.state.displayName)
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
					} else {
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
		$('#rsvpForm').removeClass('hidden');
		$('#alreadyRSVPed').addClass('hidden');
		$('#onRSVP').addClass('hidden');
		var button = $(event.relatedTarget);
		var venueId = button.data('venue-id');
		var venueName = button.data('venue-name');
		var street, zip, city, country;
		if (venueId) {
			$.ajax('http://api.songkick.com/api/3.0/venues/' + button.data('venue-id') + '.json?apikey=' + apiKey)
				.done(function (response) {
					var curVenue = response.resultsPage.results.venue;
					street = curVenue.street;
					zip = curVenue.zip;
					city = curVenue.city.displayName;
					country = curVenue.city.country.displayName;
					venueName = curVenue.displayName;
					modal.find('#rsvpStreet').text(street);
					modal.find('#rsvpZip').text(zip); {}
					if (venueName !== 'Unknown venue') {
						venueName = curVenue.displayName;
						$('#rsvpShowVenue').show();
					} else {
						venueName = '';
						$('#rsvpShowVenue').hide();
					}
					modal.find('#rsvpShowVenue').text(venueName);
					modal.find('#rsvpCity').text(city);
					if(state.length) {
						modal.find('#rsvpState').text(', ' + state);
					} else {
						modal.find('#rsvpState').empty();
					}
					modal.find('#rsvpCountry').text(country);
				})
				.fail(function(error) {
					$('#results').append('<p class="apiError">An error occurred while retrieving event data from the API :(');
				});
		} else {
			$('#rsvpShowVenue').text('TBA');
			$('#rsvpStreet').empty();
			$('#rsvpZip').empty();
			$('#rsvpCity').empty();
			$('#rsvpState').empty();
			$('#rsvpCountry').empty();
		}		

		var id = button.data('id');
		var uri = button.data('uri');
		var title = button.data('title');
		var lineup = button.data('lineup');
		var showDate = button.data('date');
		var state = button.data('state');
		var modal = $(this);
		modal.find('#eventId').val(id);
		modal.find('#eventUri').val(uri);
		modal.find('#rsvpTitle').text(title);
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
			modal.find('#rsvpShowDate').text(moment(showDate).format('M/D/YYYY') + ' (Time Not Given)');
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
