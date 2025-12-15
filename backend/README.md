**Backend README (Quick Start for Front-End Devs)**

# What this is

A minimal Express + Mongoose API for creating events and collecting availability. You can run it locally on `http://localhost:50001` and call two endpoints to build your front end.

# Prereqs

* Node 18+ and npm
* A MongoDB URI (Atlas or local)

# Setup (Please D)

1. Install deps
   `npm i`

2. Create `.env` in project root

```
MONGODB_URI=<your Mongo connection string>
PORT=50001
```

3. Start the API

* Dev (auto-reload): `npm run dev`
* Prod: `npm start`
  You should see: `Server listening at http://localhost:50001` and `MongoDB connected: <db-name>`

---

# File map (what you’ll touch)

* `app.js` – Express app and route mounting
* `server.js` – boots app + DB
* `config/db.js` – Mongo connection
* `models/*.js` -  Dabatabase models
* `routes/*.js` – HTTP paths
* `controllers/*.js` – request handlers

---

# MongoDB terms

* document: a data entry
* collection: a table in SQL
* schema: an enforced data structure for entries in a collection

---

# Data model (high level)

## Event

```js
{
  _id: ObjectId,
  title: string,
  description?: string,
  creator: ObjectId, // referring to a user 
  window: { start: Date, end: Date },
  participants: [ObjectId], // a list of reference to users
  determinedTime?: Date,
  schemaVersion: number,
  createdAt: Date,
  updatedAt: Date
}
```

## Availability

```js
{
  _id: ObjectId, // created by default by MongoDB
  eventId: ObjectId, // referring to an event
  userId: ObjectId, // referring to a user
  slots: [string], //ISO string, where each string represent a 15-min block starting from time indicated by string
  timezone: string,
  schemaVersion:number,
  createdAt: Date,
  updatedAt: Date
}
```

## User

```js
{
  userName: string,
  email: string,
  password: string
  createdAt: Date,
  updatedAt: Date
}
```
---

# Validation & Business Rules

* `window.start < window.end`.
* `participants[].email` must be valid email.
* Availability `slots` must not overlap internally; when `strict=true` (default), each slot must fall within the event `window`.
* `determinedTime` must fall within the `window`.

---

# Changelog

* **v1.1** (2025‑10‑15): Updated routes & responses to match new CRUD controllers; clarified upsert semantics; added `/summary` endpoint and bulk participant management.
* **v1.0**: Initial draft.

---

# Postman Examples

```bash
POST http://localhost:50001/api/events
  select raw->json
  input the following to HTTP request body
  '{
    "title":"Kickoff","description":"Align",
    "creator":"someone@test.com",
    "window":{"start":"2025-10-12T09:00:00Z","end":"2025-10-16T18:00:00Z"},
    "participants":[{"email":"alice@example.com"}]
  }'

PUT http://localhost:50001/api/availability
  select raw->json
  input the following to HTTP request body
  '{
    "eventId":"6501abcd1234567890abcdef",
    "email":"bob@example.com",
    "userName":"Bob",
    "timeZone":"America/New_York",
    "slots":["2025-10-13T14:00:00Z","2025-10-13T14:30:00Z"]
  }'
```

---

# Common pitfalls (and fixes)

* 400 “validation failed”: ensure required fields are present and body is in correct JSON format (e.g. uses double quotes, add colon to separate entries).
* 403 from local testing: usually occupied port or wrong route.
* “Cannot connect to Mongo”: check `.env` `MONGODB_URI`.

---

# Notes (under development...)
