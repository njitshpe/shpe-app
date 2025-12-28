# API DESIGN — EVENT ENGAGEMENT & GAMIFICATION APP (MVP)

This document defines the **complete MVP API surface** for the Event Engagement & Gamification mobile app.

Scope:
- Designed for **2-week MVP**
- Optimized for **Expo + Supabase**
- Clean separation between **MVP** and **Post-MVP**
- Built to support **future AI expansion without schema breaks**

---

## 1. API DOMAINS (MENTAL MODEL)

All backend functionality is organized into the following domains:

```

AUTH & USERS
EVENTS
RSVP
CHECK-IN (QR)
POINTS & GAMIFICATION
FEED & HIGHLIGHTS
NOTIFICATIONS
ADMIN

````

Each feature in the product maps cleanly into one of these domains.

---

## 2. AUTH & USERS API

Authentication is handled by **Supabase Auth (JWT)**.  
No custom login endpoints are required.

### Endpoints

```http
GET    /me
PATCH  /me/profile
GET    /users/{user_id}
````

### Responsibilities

* Fetch authenticated user
* Update profile information
* Fetch public user profiles

### User Roles

* undergrad_njit
* undergrad_other
* alumni_njit
* alumni_other
* admin (flag)

### Profile Fields

* name
* role
* major
* profile_picture_url
* points_total
* rank
* events_attended_count

---

## 3. EVENTS API (CORE)

Supports calendar view and single event pages.

### Endpoints

```http
GET    /events
GET    /events/{event_id}
POST   /events                (admin)
PATCH  /events/{event_id}     (admin)
```

### Event Fields

* id
* title
* description
* start_time
* end_time
* location
* flyer
* status:
  * upcoming
  * open
  * closed
* created_by (admin)

### Notes

* `status=open` enables QR check-in
* `status=closed` disables all check-ins

---

## 4. RSVP API

Tracks intent to attend and supports notifications.

### Endpoints

```http
POST   /events/{event_id}/rsvp
DELETE /events/{event_id}/rsvp
GET    /events/{event_id}/rsvps     (admin)
```

### Rules

* One RSVP per user per event
* RSVP does NOT equal attendance
* Used for reminders and attendance forecasting

---

## 5. QR CHECK-IN API (CRITICAL PATH)

This endpoint powers the **one-tap, no-form check-in experience**.

### Endpoint

```http
POST /events/{event_id}/check-in
```

### Request Body

```json
{
  "qr_token": "short_lived_event_token"
}
```

### Validation Logic

* User is authenticated
* Event exists Event status == `open` QR token is valid User has not already checked in

### Response

```json
{
  "checked_in": true,
  "points_awarded": 50
}
```

### Backend Side Effects

* Create check-in record
* Award points
* Create feed entry
* Trigger success notification

### Security Notes

* QR token must be event-scoped or time-limited
* One check-in per user per event (hard constraint)

---

## 6. POINTS & GAMIFICATION API

Drives engagement, competition, and rankings.

### Endpoints

```http
GET  /points/me
POST /points/award            (admin or system)
GET  /leaderboard
```

### MVP Point Sources

* RSVP
* Event check-in
* Photo upload
* Manual admin bonus

### Notes

* Facial recognition multipliers are NOT part of MVP
* Points logic must be auditable

---

## 7. HIGHLIGHTS / PHOTO UPLOAD API

Supports event highlights and feed content.

### Endpoints

```http
POST /events/{event_id}/photos
GET  /events/{event_id}/photos
```

### Rules

* User must be checked in to upload
* Photos stored in Supabase Storage
* Database stores:

  * photo_url
  * event_id
  * uploaded_by
  * timestamp
  * points_awarded

### Purpose

* Visual proof of attendance
* Fuel for feed and FOMO
* Foundation for future AI

---

## 8. FEED API

Chronological social feed.

### Endpoint

```http
GET /feed
```

### Feed Item Types

* Event attendance
* Photo uploads
* Shoutouts
* Member of the Month
* Committee Member of the Week

### Ordering

* Chronological (MVP)
* No ranking algorithm

---

## 9. NOTIFICATIONS API

Handles push notifications and device registration.

### Endpoints

```http
POST /notifications/register-device
POST /notifications/send          (admin/system)
```

### Used For

* Event reminders
* Event open/close alerts
* Points awarded confirmations

---

## 10. ADMIN API

Admin-only control plane.

### Endpoints

```http
POST   /admin/events
PATCH  /admin/events/{event_id}/status
POST   /admin/points/award
POST   /admin/member-of-month
GET    /admin/analytics
```

### Admin Capabilities

* Create and manage events
* Open / close check-in window
* Award bonus points
* Select Member of the Month
* View basic engagement analytics

### MVP Analytics

* Attendance count per event
* Active members
* Points distribution

---

## 11. FUTURE APIs (DESIGNED, NOT BUILT)

The following endpoints are explicitly **out of MVP scope** but should be supported by the schema design:

```http
POST /ai/facial-recognition
POST /resumes/upload
POST /linkedin/scrape
POST /carla/insights
GET  /recommendations/members
```

These will be added in later phases without breaking existing APIs.

---

## 12. SECURITY & CONSTRAINTS (NON-NEGOTIABLE)

* All endpoints require authentication unless explicitly public
* Admin endpoints are role-gated
* One check-in per user per event
* Photos require prior check-in
* Events must be OPEN to allow check-in
* Points must be traceable to an action

---

## 13. MVP API SUMMARY

### MUST BUILD

* Events
* RSVP
* QR check-in
* Points
* Photos
* Feed
* Notifications
* Admin controls

### MUST NOT BUILD (MVP)

* Facial recognition
* Resume parsing
* LinkedIn scraping
* AI insights (CARLA)
* Social graph

---

## END OF DOCUMENT

```

---

If you want, next I can:

- Generate the **Postgres schema** that maps 1:1 to this API  
- Write **Supabase Edge Function code** for QR check-in  
- Create **OpenAPI / Swagger spec**  
- Produce **Expo-side API client hooks**

Just tell me the next artifact you want.
```