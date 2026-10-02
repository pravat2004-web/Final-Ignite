# IGNITE Freshers Event

A responsive single-page React/Vite website for the IGNITE freshers event hosted by the Master of Computer Applications Department at Centurion University of Technology and Management.

## Frontend-only architecture

This project runs entirely in the browser. It has no Supabase, Supabase Auth, RLS, Vercel Functions, Resend, database, server API, QR scanner, or staff portal configuration.

All public forms submit directly to Formspree:

| Form | Endpoint |
| --- | --- |
| Main registration | `https://formspree.io/f/mdekbzvl` |
| Activity participation | `https://formspree.io/f/mgavdyjg` |
| Contact | `https://formspree.io/f/myezojna` |
| Feedback | `https://formspree.io/f/myezojna` |

Registrations are also posted to the connected Google Apps Script Web App for Google Sheets duplicate checking and QR-ticket workflow:

```text
https://script.google.com/macros/s/AKfycbxaAFZc_-dvBbvx2NfXQvrK3uDG6ipPukwY8TcCM96XEyhfH06dDGl2Yqbgulj3OG4FdA/exec
```

The registration form collects:

- Full name
- University email
- Registration number
- Food preference: Veg or Non-Veg

The browser validates registration email addresses against these domains before submission:

```text
@centurionuniv.edu.in
@cutm.ac.in
```

The registration form also stores the submitted email and registration number in the browser's local storage and blocks a duplicate from that same browser. Because this project uses Formspree only and has no database, a person can bypass this safeguard by switching browsers or devices. Enforcing uniqueness across every device requires a server-side database or registration service.

Formspree receives the submitted fields and sends notifications according to the settings in your Formspree account. Formspree alone does not create unique QR codes, send QR attachments, or provide a staff check-in database.

## Google Sheets QR check-in add-on

The registration payload includes the fields needed by the Google Workspace Marketplace add-on [QR Code Ticket Per Row For Check-In](https://workspace.google.com/marketplace/app/qr_code_ticket_per_row_for_checkin/9398047938):

```text
registrationId
name
email
registrationNumber
foodPreference
_date
checkedIn
checkInTime
```

Configure Formspree or your Google Sheets import so each registration becomes one row with these column names. Install the add-on from Google Sheets, select the registration sheet, and configure it to use `registrationId` as the attendee/ticket identifier. The add-on can generate one QR ticket per row and use its mobile scanner to record check-ins in the sheet.

The website submits each registration to Formspree and then to the Apps Script Web App using `text/plain` JSON. The Apps Script should check for duplicate email/registration number, write the row to Google Sheets, and return a successful response. The add-on then handles QR generation and staff scanning inside Google Sheets.

## Formspree setup

1. Open each endpoint in your Formspree account.
2. Confirm the endpoint is active.
3. Configure the notification email address.
4. Submit a test from the website.
5. Confirm the submission appears in the Formspree dashboard and arrives at the configured notification inbox.

No environment variables are required for the frontend. Do not add Supabase, Resend, or service-role keys to this project.

## Install and run

```bash
npm install
npm run dev
```

The development server listens on `http://localhost:3000`.

Create a production build with:

```bash
npm run build
```

Deploy the generated `dist` directory to Vercel, Netlify, GitHub Pages, or another static hosting provider. There are no server-side environment variables or serverless functions to configure.

## Project structure

```text
src/
├── components/       # Event sections and Formspree-powered forms
├── config.js          # Event copy, Formspree endpoints, and media paths
├── App.jsx            # Single-page application shell
└── index.css          # Responsive neon/cyan styling
public/                # Invitation artwork, videos, and static assets
```

## Event details

- Poster release: 5 October 2026
- Main event: 9 October 2026
- Venue: Gym Area, CUTM Campus
