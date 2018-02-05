# For the Tour

**NOTE: this site is deployed using Github Pages at https://cashbasket.github.io/for-the-tour**

**For the Tour** is a website that allows users to find upcoming tour dates for their favorite bands/artists, as well as RSVP for shows.  It was built using HTML5, CSS, Javascript/jQuery and [Firebase](https://firebase.google.com), along with several external APIs, including the [Songkick API](https://www.songkick.com/developer), the Google Sign-In API, the Google Maps API, and the Google Calendar API. Several JavaScript/jQuery plugins were also used, such as [Quill](https://www.quilljs.com), [Moment](https://www.momentjs.com) and [Nicescroll](https://nicescroll.areaaperta.com/).

While it is possible to use the site without signing in (with a valid Google account), users won't be able to RSVP for shows or add events to their calendars unless they do so.

## Navigating the Site

The site is [hopefully] designed to be as straightforward as possible in terms of navigation. Upon landing on the homepage, the user can simply enter the name of a band or artist into the search field, and click the "Search" button. Doing so will take the user to the search results page, which lists all shows returned by the search criteria, including a map of the shows' locations. Clicking on a map marker will display the title of the show in an info window, and clicking on the show title will take the user to the listing for that particular show. Or, if the user wishes to ignore the map, they may simply scroll through the listings.

Clicking on the "More Info/RSVP" button for an event opens a modal window with more details on the show, including a link to the venue's website (if the venue has one).  If the user is signed in, then a link that allows the user to add the event to their Google Calendar will also be visible, as will a text editor that allows them to RSVP for the show.

## RSVPs

Once someone has created an RSVP for a show, it will be stored in Firebase, and will be visible on the event's RSVPs page, which is accessed by clicking the "View RSVPs" button next to the "More Info/RSVP" button for the event. Please note that the "View RSVPs" button will only be visible if the event has at least one RSVP.

The RSVP will also be viewable on the user's RSVPs page, which can be reached by clicking the "My RSVPs" link next to the user's portrait in the top-right corner of the screen. On that page, the user can both view all the RSVPs they've created and update RSVPs for *upcoming* shows. To edit an RSVP, simply click on the icon in the upper-right corner of the RSVP body. RSVPs can only be updated if the show hasn't happened yet; if a show's date has come and gone, the user can no longer update that RSVP.

## Signing Out

To sign out of the site, click on the user portrait in the upper-right corner of the screen, and then click the "Sign Out" link that appears.