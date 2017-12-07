// Initialize Firebase
var firebaseConfig = {
	apiKey: 'AIzaSyDs9iz9p-7I_mGuLqHUlhnz-sSQyqwgE_c',
	authDomain: 'for-the-tour.firebaseapp.com',
	databaseURL: 'https://for-the-tour.firebaseio.com',
	projectId: 'for-the-tour',
	storageBucket: 'for-the-tour.appspot.com',
	messagingSenderId: '725149234874'
};
firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var eventsRef = database.ref('/events');

function addEvent(eventId, lineup, showtime, venue, city, region, country, firstName, lastName, email, message) {
	eventsRef.orderByChild('eventId').equalTo(eventId).once('value', function(snapshot) {
		const eventData = snapshot.val();
		var key;
		if (!eventData) {
			key = eventsRef.push({
				eventId: eventId,
				lineup: lineup,
				showtime: showtime,
				venue: venue,
				city: city,
				region: region,
				country: country,
				rsvpCount: 0
			}).key;
		} else {
			key = Object.keys(snapshot.val())[0];
		}
		checkForRsvp(eventId, firstName, lastName, email, message, function(eventId, firstName, lastName, email, message) {
			database.ref('/rsvps').push({
				eventId: eventId,
				firstName: firstName,
				lastName: lastName,
				email: email,
				message: message
			}, function(error) {
				if (!error) {
					database.ref('/events/' + key).once('value', function(snap) {
						var newRsvpCount = parseInt(snap.val().rsvpCount) + 1;
						database.ref('/events/' + key).update({
							rsvpCount: newRsvpCount
						});
					});
					onRsvp();
				}
			});
		});
		
	});
}

function onRsvp() {
	//if the RSVP was successfully added, do stuff
	$('#rsvpForm').addClass('hidden');
	$('#onRSVP').removeClass('hidden');
	$('.ql-editor > p').empty();
	$('.ql-editor').addClass('ql-blank');
}

function checkForRsvp(eventId, firstName, lastName, email, message, fn) {
	var rsvpsRef = database.ref('/rsvps/');
	var alreadyRsvped = false;
	rsvpsRef.orderByChild('email').equalTo(email).once('value', function(snapshot) {
		const userData = snapshot.val();
		if(userData) {
			snapshot.forEach(function(child) {
				if (child.val().eventId == eventId) {
					alreadyRsvped = true;
				}
			});
		}
		if (!alreadyRsvped) {
			fn(eventId, firstName, lastName, email, message);
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
		theme: 'snow'  // or 'bubble'
	});
	
	$('#searchForm').on('submit', function(event) {
		$('.results-table-wrapper, .apiError').hide();
		event.preventDefault();
		$('#results').removeClass('hidden');
		var band = $('#bandName').val().trim();
		if (band.length) {
			$.ajax('https://rest.bandsintown.com/artists/' + encodeURIComponent(band) + '/events?app_id=for-the-tour')
				.done(function (response) {
					$('#resultsTable > tbody').empty();
					if(response.length) {
						$('.no-results').addClass('hidden');
						for (var i = 0; i < response.length; i++) {
							var curEvent = response[i];
							var dateFormat = moment(curEvent.datetime).format('M/D/YYYY @ h:mma');
							var lineup = '';
							var location = curEvent.venue.city;
							if (curEvent.venue.region.length && isNaN(parseInt(curEvent.venue.region))) {
								location += ', ' + curEvent.venue.region;
							}
							for (var j=0; j < curEvent.lineup.length; j++) {
								lineup += curEvent.lineup[j];
								if (j < curEvent.lineup.length - 1) {
									lineup += ', ';
								}
							}				

							var tr = $('<tr><td width="250">' + lineup + '</td><td>' + dateFormat  + '</td><td>' + curEvent.venue.name + '</td><td>' + location + '</td><td>' + curEvent.venue.country + '</td>');
						
							var rsvpCell = $('<td>');
							var rsvpButton = $('<button>');
							rsvpButton.addClass('rsvp btn btn-rsvp');
							rsvpButton.attr('data-id', curEvent.id)
								.attr('data-lineup', lineup)
								.attr('data-date', curEvent.datetime)
								.attr('data-venue', curEvent.venue.name)
								.attr('data-city', curEvent.venue.city)
								.attr('data-region', curEvent.venue.region)
								.attr('data-country', curEvent.venue.country)
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
				.fail(function (error) {
					$('#results').append('<p class="apiError">An error occurred while retrieving data from the API :(');
				});
		} 
		$('#bandName').val('');
	});

	$('#rsvpModal').on('show.bs.modal', function (event) {
		$('#rsvpForm').removeClass('hidden');
		$('#alreadyRSVPed').addClass('hidden');
		$('#onRSVP').addClass('hidden');
		var button = $(event.relatedTarget);
		var id = button.data('id');
		var lineup = button.data('lineup');
		var showDate = button.data('date');
		var venue = button.data('venue');
		var city = button.data('city');
		var region = button.data('region');
		var country = button.data('country');
		var modal = $(this);
		modal.find('#eventId').val(id);
		modal.find('#datetime').val(moment(showDate).format('X'));
		//get number of RSVPs for each event, and append it to the td
						
		database.ref('/rsvps').orderByChild('email').equalTo($('#rsvpEmail').text()).once('value', function(snapshot) {
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
		modal.find('#rsvpShowDate').text(moment(showDate).format('M/D/YYYY @ h:mma'));
		modal.find('#rsvpShowVenue').text(venue);
		modal.find('#rsvpCity').text(city);
		if(region  && isNaN(parseInt(region))) {
			modal.find('#rsvpRegion').text(', ' + region);
		} else {
			modal.find('#rsvpRegion').empty();
		}
		modal.find('#rsvpCountry').text(', ' + country);
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
		var lineup = $('#rsvpLineup').text();
		var showtime = $('#datetime').val();
		var venue = $('#rsvpShowVenue').text();
		var city = $('#rsvpCity').text();
		var region = $('#rsvpRegion').text().substring(2);
		var country = $('#rsvpCountry').text().substring(2);
		var firstName = $('#rsvpGivenName').text();
		var lastName = $('#rsvpFamilyName').text();
		var email = $('#rsvpEmail').text();
		var message = $('.ql-editor').html();

		addEvent(eventId, lineup, showtime, venue, city, region, country, firstName, lastName, email, message);
	});
});
