Chatbot upcoming events Excel setup

1) Place your Excel file at:
   public/data/upcoming-events.xlsx

2) Use row 1 as headers. Supported headers:
   - Event name (or Event, Title, Name)
   - Date (or Event Date)
   - Time (or Timing, Event Time, Start Time)
   - Venue (or Location, Place)
   - Description (optional)
   - Registration Link (or Registration, Register, Link, URL) (optional)

3) The chatbot reads this sheet for upcoming-event questions and replies with:
   event name + date/time/venue (if available).

4) If the sheet is missing or details are not available, chatbot replies:
   upcoming details will be released soon.

Optional:
Set env var UPCOMING_EVENTS_EXCEL_PATH to override file path.
