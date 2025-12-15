# API (what you can call)

## Events Endpoints

### POST `/events`

Create an event.

* **Body**

```json
{
  "title": "Sprint Planning",
  "description": "Q4 project planning",
  "creator": "alice@example.com",
  "window": { "start": "2025-10-20T13:00:00Z", "end": "2025-10-27T21:00:00Z" },
  "participants": [{ "email": "bob@example.com" }, { "email": "chen@example.com" }]
}
```

* **201** → returns created event
* **400** on validation errors

### GET `/events`

List events with optional filters & pagination.

* **Query params**: `creator`, `participant`, `from`, `to`, `search`, `page` (default 1), `limit` (default 20), `sort` (e.g. `-createdAt`)
* **200** → `{ items: Event[], page, limit, total }`

### GET `/events/:id`

Fetch single event by id.

* **200** → Event
* **404** if not found

### PATCH `/events/:id`

Partial update.

* **Body**: any subset of `title`, `description`, `window`, `participants`, `determinedTime`
* **200** → updated Event
* **409** on window validation (start≥end)

### DELETE `/events/:id`

Delete an event (soft delete if configured).

* **204** no content
* **404** if not found or not owned

### POST `/events/:id/participants`

Add or remove participants in bulk.

* **Body**

```json
{ "add": ["new@ex.com"], "remove": ["old@ex.com"] }
```

* **200** → updated participants array

### POST `/events/:id/determine`

Set a final meeting time (must fall within `window`).

* **Body**

```json
{ "determinedTime": "2025-10-23T18:00:00Z" }
```

* **200** → Event
* **422** if outside window

---

## Availabilities Endpoints

### PUT `/events/:eventId/availabilities`

Create or **upsert** the caller’s availability for an event (idempotent per `email`).

* **Body**

```json
{
  "email": "bob@example.com",
  "slots": [
    { "start": "2025-10-21T13:00:00Z", "end": "2025-10-21T14:00:00Z" },
    { "start": "2025-10-22T16:00:00Z", "end": "2025-10-22T17:30:00Z" }
  ],
  "comment": "Prefer afternoons"
}
```

* **200** → upserted Availability
* **400** if any slot start≥end or out of event window (strict mode)

### GET `/events/:eventId/availabilities`

List all availabilities for an event.

* **Query**: `email` (optional to filter one person)
* **200** → `Availability[]`

### GET `/events/:eventId/availability/:email`

Get a single person’s availability for an event.

* **200** → Availability or `{ slots: [] }` if none
* **404** if event not found

### DELETE `/events/:eventId/availability/:email`

Delete a person’s availability.

* **204**

---

## User Endpoints