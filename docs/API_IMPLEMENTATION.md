# API Implementation Schemas (MVP)

This document provides full JSON Schema definitions for request bodies (inputs) and response bodies (outputs) of all MVP endpoints from API_DESIGN.md. All schemas use JSON Schema 2020-12. Inputs are for request bodies; outputs are for response bodies. Standard error responses use the schema below:

```json
{
  "type": "object",
  "properties": {
    "error": { "type": "string" },
    "message": { "type": "string" }
  },
  "required": ["error", "message"]
}
```

## 1. AUTH & USERS API

### GET /me
- **Input Schema**: N/A
- **Output Schema** (200):
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "role": { "type": "string", "enum": ["undergrad_njit", "undergrad_other", "alumni_njit", "alumni_other"] },
    "major": { "type": "string" },
    "profile_picture_url": { "type": "string", "format": "uri" },
    "points_total": { "type": "integer" },
    "rank": { "type": "integer" },
    "events_attended_count": { "type": "integer" }
  },
  "required": ["id", "name", "role", "points_total", "rank", "events_attended_count"]
}
```

### PATCH /me/profile
- **Input Schema** (request body):
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "major": { "type": "string" },
    "profile_picture_url": { "type": "string", "format": "uri" }
  }
}
```
- **Output Schema** (200):
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "role": { "type": "string", "enum": ["undergrad_njit", "undergrad_other", "alumni_njit", "alumni_other"] },
    "major": { "type": "string" },
    "profile_picture_url": { "type": "string", "format": "uri" },
    "points_total": { "type": "integer" },
    "rank": { "type": "integer" },
    "events_attended_count": { "type": "integer" }
  },
  "required": ["id", "name", "role", "points_total", "rank", "events_attended_count"]
}
```

### GET /users/{user_id}
- **Input Schema**: N/A
- **Output Schema** (200): Same as GET /me output schema.

## 2. EVENTS API

### GET /events
- **Input Schema**: N/A
- **Output Schema** (200):
```json
{
  "type": "object",
  "properties": {
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "start_time": { "type": "string", "format": "date-time" },
          "end_time": { "type": "string", "format": "date-time" },
          "location": { "type": "string" },
          "flyer": { "type": "string", "format": "uri" },
          "status": { "type": "string", "enum": ["upcoming", "open", "closed"] },
          "created_by": { "type": "string", "format": "uuid" }
        },
        "required": ["id", "title", "start_time", "end_time", "status"]
      }
    }
  },
  "required": ["events"]
}
```

### GET /events/{event_id}
- **Input Schema**: N/A
- **Output Schema** (200): Single event object (same as array item above).

### POST /events (admin)
- **Input Schema** (request body):
```json
{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "description": { "type": "string" },
    "start_time": { "type": "string", "format": "date-time" },
    "end_time": { "type": "string", "format": "date-time" },
    "location": { "type": "string" },
    "flyer": { "type": "string", "format": "uri" },
    "status": { "type": "string", "enum": ["upcoming", "open", "closed"] }
  },
  "required": ["title", "start_time", "end_time"]
}
```
- **Output Schema** (201): Created event object (same as GET single event).

### PATCH /events/{event_id} (admin)
- **Input Schema** (request body):
```json
{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "description": { "type": "string" },
    "start_time": { "type": "string", "format": "date-time" },
    "end_time": { "type": "string", "format": "date-time" },
    "location": { "type": "string" },
    "flyer": { "type": "string", "format": "uri" },
    "status": { "type": "string", "enum": ["upcoming", "open", "closed"] }
  }
}
```
- **Output Schema** (200): Updated event object (same as GET single event).

## 3. RSVP API

### POST /events/{event_id}/rsvp
- **Input Schema**: N/A (empty body)
- **Output Schema** (201):
```json
{
  "type": "object",
  "properties": {
    "rsvp": {
      "type": "object",
      "properties": {
        "user_id": { "type": "string", "format": "uuid" },
        "event_id": { "type": "string", "format": "uuid" },
        "created_at": { "type": "string", "format": "date-time" }
      },
      "required": ["user_id", "event_id", "created_at"]
    }
  },
  "required": ["rsvp"]
}
```

### DELETE /events/{event_id}/rsvp
- **Input Schema**: N/A
- **Output Schema** (200):
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" }
  },
  "required": ["success"]
}
```

### GET /events/{event_id}/rsvps (admin)
- **Input Schema**: N/A
- **Output Schema** (200):

//should be changed to list of rsvps per event

```json 
{
  "type": "object",
  "properties": {
    "rsvps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "user_id": { "type": "string", "format": "uuid" },
          "event_id": { "type": "string", "format": "uuid" },
          "created_at": { "type": "string", "format": "date-time" }
        },
        "required": ["user_id", "event_id", "created_at"]
      }
    }
  },
  "required": ["rsvps"]
}
```

## 4. QR CHECK-IN API

### POST /events/{event_id}/check-in
- **Input Schema** (request body):
```json
{
  "type": "object",
  "properties": {
    "qr_token": { "type": "string" }
  },
  "required": ["qr_token"]
}
```
- **Output Schema** (200):
```json
{
  "type": "object",
  "properties": {
    "checked_in": { "type": "boolean" },
    "points_awarded": { "type": "integer" }
  },
  "required": ["checked_in", "points_awarded"]
}
```

## 5. POINTS & GAMIFICATION API

### GET /points/me
- **Input Schema**: N/A
- **Output Schema** (200):
```json
{
  "type": "object",
  "properties": {
    "points": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "user_id": { "type": "string", "format": "uuid" },
          "event_id": { "type": "string", "format": "uuid" },
          "source": { "type": "string", "enum": ["rsvp", "checkin", "photo", "manual"] },
          "points": { "type": "integer" },
          "awarded_at": { "type": "string", "format": "date-time" },
          "awarded_by": { "type": "string", "format": "uuid" }
        },
        "required": ["id", "user_id", "source", "points", "awarded_at"]
      }
    }
  },
  "required": ["points"]
}
```

### POST /points/award (admin or system)
- **Input Schema** (request body):
```json
{
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "format": "uuid" },
    "event_id": { "type": "string", "format": "uuid" },
    "source": { "type": "string", "enum": ["rsvp", "checkin", "photo", "manual"] },
    "points": { "type": "integer" }
  },
  "required": ["user_id", "source", "points"]
}
```
- **Output Schema** (201): Created point object (same as array item above).

### GET /leaderboard
- **Input Schema**: N/A
- **Output Schema** (200):
```json
{
  "type": "object",
  "properties": {
    "leaderboard": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "user_id": { "type": "string", "format": "uuid" },
          "name": { "type": "string" },
          "points_total": { "type": "integer" },
          "rank": { "type": "integer" }
        },
        "required": ["user_id", "name", "points_total", "rank"]
      }
    }
  },
  "required": ["leaderboard"]
}
```

## 6. HIGHLIGHTS / PHOTO UPLOAD API

### POST /events/{event_id}/photos
- **Input Schema** (request body): Note: Actual upload may use multipart/form-data, but for JSON API, assume metadata.
```json
{
  "type": "object",
  "properties": {
    "photo_url": { "type": "string", "format": "uri" }
  },
  "required": ["photo_url"]
}
```
- **Output Schema** (201):
```json
{
  "type": "object",
  "properties": {
    "photo": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "event_id": { "type": "string", "format": "uuid" },
        "photo_url": { "type": "string", "format": "uri" },
        "uploaded_by": { "type": "string", "format": "uuid" },
        "points_awarded": { "type": "integer" },
        "uploaded_at": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "event_id", "photo_url", "uploaded_by", "points_awarded", "uploaded_at"]
    }
  },
  "required": ["photo"]
}
```

### GET /events/{event_id}/photos
- **Input Schema**: N/A
- **Output Schema** (200):
```json
{
  "type": "object",
  "properties": {
    "photos": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "event_id": { "type": "string", "format": "uuid" },
          "photo_url": { "type": "string", "format": "uri" },
          "uploaded_by": { "type": "string", "format": "uuid" },
          "points_awarded": { "type": "integer" },
          "uploaded_at": { "type": "string", "format": "date-time" }
        },
        "required": ["id", "event_id", "photo_url", "uploaded_by", "points_awarded", "uploaded_at"]
      }
    }
  },
  "required": ["photos"]
}
```

## 7. FEED API

### GET /feed
- **Input Schema**: N/A
- **Output Schema** (200):
```json
{
  "type": "object",
  "properties": {
    "feed": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "type": { "type": "string", "enum": ["attendance", "photo", "shoutout", "member_of_month", "committee_member_week"] },
          "user_id": { "type": "string", "format": "uuid" },
          "event_id": { "type": "string", "format": "uuid" },
          "content": { "type": "string" },
          "created_at": { "type": "string", "format": "date-time" }
        },
        "required": ["id", "type", "created_at"]
      }
    }
  },
  "required": ["feed"]
}
```

## 8. NOTIFICATIONS API

### POST /notifications/register-device
- **Input Schema** (request body):
```json
{
  "type": "object",
  "properties": {
    "token": { "type": "string" },
    "platform": { "type": "string", "enum": ["ios", "android"] }
  },
  "required": ["token", "platform"]
}
```
- **Output Schema** (201):
```json
{
  "type": "object",
  "properties": {
    "device": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "user_id": { "type": "string", "format": "uuid" },
        "token": { "type": "string" },
        "platform": { "type": "string", "enum": ["ios", "android"] },
        "created_at": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "user_id", "token", "platform", "created_at"]
    }
  },
  "required": ["device"]
}
```

### POST /notifications/send (admin/system)
- **Input Schema** (request body):
```json
{
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "format": "uuid" },
    "title": { "type": "string" },
    "body": { "type": "string" }
  },
  "required": ["user_id", "title", "body"]
}
```
- **Output Schema** (201):
```json
{
  "type": "object",
  "properties": {
    "notification": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "user_id": { "type": "string", "format": "uuid" },
        "title": { "type": "string" },
        "body": { "type": "string" },
        "sent_at": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "user_id", "title", "body", "sent_at"]
    }
  },
  "required": ["notification"]
}
```

## 9. ADMIN API

### POST /admin/events
- **Input Schema**: Same as POST /events input schema.
- **Output Schema** (201): Same as POST /events output schema.

### PATCH /admin/events/{event_id}/status
- **Input Schema** (request body):
```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["upcoming", "open", "closed"] }
  },
  "required": ["status"]
}
```
- **Output Schema** (200): Same as PATCH /events/{event_id} output schema.

### POST /admin/points/award
- **Input Schema**: Same as POST /points/award input schema.
- **Output Schema** (201): Same as POST /points/award output schema.

### POST /admin/member-of-month
- **Input Schema** (request body):
```json
{
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "format": "uuid" },
    "month": { "type": "string", "format": "date" }
  },
  "required": ["user_id", "month"]
}
```
- **Output Schema** (201): Feed item object (same as GET /feed array item).

### GET /admin/analytics
- **Input Schema**: N/A
- **Output Schema** (200):
```json
{
  "type": "object",
  "properties": {
    "analytics": {
      "type": "object",
      "properties": {
        "attendance_count_per_event": { "type": "object" },
        "active_members": { "type": "integer" },
        "points_distribution": { "type": "object" }
      },
      "required": ["attendance_count_per_event", "active_members", "points_distribution"]
    }
  },
  "required": ["analytics"]
}
```
