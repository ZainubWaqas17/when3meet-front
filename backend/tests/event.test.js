const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');       // your Express instance

let mongo;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

it('creates user, event, availability', async () => {
  const userRes = await request(app)
    .post('/api/users')
    .send({ name: 'Bob', email: 'bob@test.com' })
    .expect(201);

  const userId = userRes.body._id;
  const eventRes = await request(app)
    .post('/api/events')
    .send({
      title: 'Kickoff',
      creator: userId,
      window: { start: '2025-10-12T09:00Z', end: '2025-10-13T09:00Z' },
      participants: [{ userId }]
    })
    .expect(201);

  const eventId = eventRes.body._id;
  await request(app)
    .put('/api/availability')
    .send({
      eventId,
      userId,
      timeZone: 'America/New_York',
      slots: ['2025-10-12T10:00Z']
    })
    .expect(200);
});

// New Tests

it('fails to create user with missing fields', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ email: 'bob@test.com' })  // Missing 'name' field
    .expect(400);  // Expecting 400 Bad Request

  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe('Name is required');
});

it('fails to create user with invalid email', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ name: 'Bob', email: 'invalid-email' })  // Invalid email format
    .expect(400);

  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe('Invalid email format');
});

it('fails to create event with missing fields', async () => {
  const userRes = await request(app)
    .post('/api/users')
    .send({ name: 'Bob', email: 'bob@test.com' })
    .expect(201);

  const userId = userRes.body._id;

  const response = await request(app)
    .post('/api/events')
    .send({ title: 'Kickoff', creator: userId })  // Missing 'window' and 'participants'
    .expect(400);

  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe('Event window and participants are required');
});

it('fails to create event with invalid date range', async () => {
  const userRes = await request(app)
    .post('/api/users')
    .send({ name: 'Bob', email: 'bob@test.com' })
    .expect(201);

  const userId = userRes.body._id;

  const response = await request(app)
    .post('/api/events')
    .send({
      title: 'Kickoff',
      creator: userId,
      window: { start: '2025-10-14T09:00Z', end: '2025-10-13T09:00Z' },  // Invalid date range
      participants: [{ userId }]
    })
    .expect(400);

  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe('Invalid event date range');
});

it('fails to update availability for a non-existent event', async () => {
  const userRes = await request(app)
    .post('/api/users')
    .send({ name: 'Bob', email: 'bob@test.com' })
    .expect(201);

  const userId = userRes.body._id;

  const response = await request(app)
    .put('/api/availability')
    .send({
      eventId: 'nonexistent-event-id',  // Invalid event ID
      userId,
      timeZone: 'America/New_York',
      slots: ['2025-10-12T10:00Z']
    })
    .expect(404);  // Expecting Not Found

  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe('Event not found');
});

it('fails to update availability with missing fields', async () => {
  const userRes = await request(app)
    .post('/api/users')
    .send({ name: 'Bob', email: 'bob@test.com' })
    .expect(201);

  const userId = userRes.body._id;

  const eventRes = await request(app)
    .post('/api/events')
    .send({
      title: 'Kickoff',
      creator: userId,
      window: { start: '2025-10-12T09:00Z', end: '2025-10-13T09:00Z' },
      participants: [{ userId }]
    })
    .expect(201);

  const eventId = eventRes.body._id;

  const response = await request(app)
    .put('/api/availability')
    .send({
      eventId,
      userId
      // Missing 'slots' field
    })
    .expect(400);

  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe('Slots are required');
});
