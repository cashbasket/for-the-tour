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
						if (curEvent.venue.region.length) {
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
						rsvpButton.attr('data-artist', band)
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
					console.log(error);
				});
		} 
		$('#bandName').val('');
	});
});
