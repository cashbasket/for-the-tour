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
	$('[rel="tooltip"]').tooltip();

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
						var tr = $('<tr><td>' + band + '</td><td>' + curEvent.datetime + '</td><td>' + curEvent.venue.name + '</td><td>' + curEvent.venue.city + ', ' + curEvent.venue.region + '</td><td>' + curEvent.venue.country + '</td>');
						$('#resultsTable > tbody').append(tr);
					}
				})
				.fail(function (error) {
					console.log(error);
				});
		} else {
			$('#bandName').val('');
		}
	});
});
