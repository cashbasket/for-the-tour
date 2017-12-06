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

	$('.results-table-wrapper').hide();

	$('#searchForm').on('submit', function(event) {
		event.preventDefault();
		$('#results').removeClass('hidden');
		var band = $('#bandName').val().trim();
		if (band.length) {
			$.ajax('https://rest.bandsintown.com/artists/' + encodeURIComponent(band) + '/events?app_id=for-the-tour')
				.done(function (response) {
					$('#resultsTable > tbody').empty();
					console.log(response);
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
						
						var tr = $('<tr><td width="300">' + lineup + '</td><td>' + dateFormat  + '</td><td>' + curEvent.venue.name + '</td><td>' + location + '</td><td>' + curEvent.venue.country + '</td>');
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
						$('.results-table-wrapper').hide().slideDown();
					}
				})
				.fail(function (error) {
					$('#results').text('There was an error :(');
				});
		} 
		$('#bandName').val('');
	});

	$('#rsvpModal').on('show.bs.modal', function (event) {
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
		//Add RSVP to Firebase
	});
});
