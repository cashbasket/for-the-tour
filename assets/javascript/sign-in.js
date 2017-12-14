var CLIENT_ID = '725149234874-5pcbriu0k6nsqe1mglf4oonqcel1ibpn';
var API_KEY = 'AIzaSyA6B8Nejb7hMHFIcxtizjTPMLXPVWCxaXY';
var SCOPES = 'https://www.googleapis.com/auth/calendar profile email';
var DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
var firebaseConfig = {
	apiKey: 'AIzaSyDs9iz9p-7I_mGuLqHUlhnz-sSQyqwgE_c',
	authDomain: 'for-the-tour.firebaseapp.com',
	databaseURL: 'https://for-the-tour.firebaseio.com',
	projectId: 'for-the-tour',
	storageBucket: 'for-the-tour.appspot.com',
	messagingSenderId: '725149234874'
};
firebase.initializeApp(firebaseConfig);

var isLoggedIn = false;    
function onSignIn(googleUser) {
	// We need to register an Observer on Firebase Auth to make sure auth is initialized.
	var unsubscribe = firebase.auth().onAuthStateChanged(function(firebaseUser) {
		unsubscribe();
		// Check if we are already signed-in Firebase with the correct user.
		if (!isUserEqual(googleUser, firebaseUser)) {
			// Build Firebase credential with the Google ID token.
			var credential = firebase.auth.GoogleAuthProvider.credential(
				googleUser.getAuthResponse().id_token);
			// Sign in with credential from the Google user.
			firebase.auth().signInWithCredential(credential).catch(function(error) {
				// Handle Errors here.
				var errorCode = error.code;
				var errorMessage = error.message;
				// The email of the user's account used.
				var email = error.email;
				// The firebase.auth.AuthCredential type that was used.
				var credential = error.credential;
				// ...
			});
		}
	});
	var profile = googleUser.getBasicProfile();
	var email = profile.getEmail();
	var photo = profile.getImageUrl();
	// The ID token you need to pass to your backend:
	var id_token = googleUser.getAuthResponse().id_token;
	isLoggedIn = true;
    
	var eventId = $.urlParam('eventId');
	firebase.auth().onAuthStateChanged(function(user) {
		if (user && !eventId && $('.rsvp-list').length) {
			//load MY rsvps
			setColumns($('.rsvp-results').width());
			$(window).on('resize', function() {	
				setColumns($('.rsvp-results').width());
				for (var i = 0; i < $('.rsvp-item').length; i++) {
					//reposition item
					positionItem(i);
				}
			});
			$('.rsvp-list').empty();
			viewRsvps(eventId);
		}
	});

	if (isLoggedIn) {
		$('#rsvp-container, #rsvpSubmit, #userPhotoFigure').removeClass('hidden');
		$('#signInToRSVP').addClass('hidden');
		$('.user-info').html('<img src="' + photo + '" data-toggle="popover" data-html="true" data-placement="left" data-content="<strong>' + profile.getName() + '</strong> (<a class=\'sign-out\' href=\'#\'>Sign Out</a>)" />');
		$('.g-signin2').hide();
		$('[data-toggle="popover"]').popover();
		$('.user-info').removeClass('hidden');
		$('#userPhotoFigure').html('<img src="' + photo + '" class="img-responsive" />');
		$('#loginRSVPs').removeClass('hidden');
		$('#addToCalendarLink').removeClass('hidden');
		var calendarLink = $('<a class="add-to-calendar">').text('Add to Google Calendar');
		$('#addToCalendarLink').append('<i class="far fa-calendar-plus"></i> ').append(calendarLink);
	}
}
function isUserEqual(googleUser, firebaseUser) {
	if (firebaseUser) {
		var providerData = firebaseUser.providerData;
		for (var i = 0; i < providerData.length; i++) {
			if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
                providerData[i].uid === googleUser.getBasicProfile().getId()) {
				// We don't need to reauth the Firebase connection.
				return true;
			}
		}
	}
	return false;
}

function handleClientLoad() {
	gapi.load('client:auth2', initClient);
}

function initClient() {
	gapi.client.init({
		apiKey: API_KEY,
		clientId: CLIENT_ID,
		discoveryDocs: DISCOVERY_DOCS,
		scope: SCOPES
	});
}

function makeApiCall(event) {
	gapi.client.load('calendar', 'v3', function() {
		var request = gapi.client.calendar.events.insert({
			'calendarId': 'primary',
			'resource': event
		}); 
		request.execute(function(resp) {
			$('#addToCalendarLink').addClass('hidden');
			$('#eventAdded').removeClass('hidden');
		});
	});
}        

function createEvent() {
	var title = $('#rsvpTitle').text();
	var street = $('#rsvpStreet').text();
	var city = $('#rsvpCity').text();
	var state = $('#rsvpState').text();
	var zip = $('#rsvpZip').text();
	var country = $('#rsvpCountry').text();
	var start = $('#datetime').val().trim();
	var venue = $('#rsvpShowVenue').text();
	var lineup = $('#rsvpLineup').text();
	if(start.length > 10) {
		var end = moment(start).add(4, 'h');
		var event = {
			'summary': title,
			'location': street + ', ' + city + state + ' '  + zip + ', ' + country,
			'description': 'Lineup includes: ' + lineup,
			'start': {
				'dateTime': start,
				'timeZone': 'America/Los_Angeles'
			},
			'end': {
				'dateTime': end,
				'timeZone': 'America/Los_Angeles'
			},
			'reminders': {
				'useDefault': false,
				'overrides': [
					{'method': 'email', 'minutes': 24 * 60},
					{'method': 'popup', 'minutes': 60}
				]
			}
		};
	} else {
		var event = {
			'summary': title,
			'location': street + ', ' + city + state + ' '  + zip + ', ' + country,
			'description': 'Lineup includes: ' + lineup,
			'start': {
				'date': start,
				'timeZone': 'America/Los_Angeles'
			},
			'end': {
				'date': start,
				'timeZone': 'America/Los_Angeles'
			},
			'reminders': {
				'useDefault': false,
				'overrides': [
					{'method': 'email', 'minutes': 24 * 60}
				]
			}
		};
	}
	makeApiCall(event);
}
function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		firebase.auth().signOut();
		// disable RSVPs
		$('#rsvp-container, #rsvpSubmit, #userPhotoFigure').addClass('hidden');
		$('#signInToRSVP').removeClass('hidden');
		$('#loginRSVPs').addClass('hidden');
		isLoggedIn = false;
		// hide user info and show sign-in button
		$('.g-signin2').show();
		$('.user-info, #addToCalendarLink').empty().addClass('hidden');
	});
}
$(document).ready(function() {            
	$('body').on('click', '.sign-out', function() {
		signOut();
	});
	$('body').on('click', '.add-to-calendar', function() {
		createEvent();
	});
});