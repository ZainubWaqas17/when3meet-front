//run: npx jest user.test.js

const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/user_model");

let mongoServer;

// Setup: Start in-memory MongoDB before all tests
beforeAll(async () => {
  await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup: Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Teardown: Stop MongoDB and close connections after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Basic Route Tests - One Test Per Route", () => {

  // Test for: POST /users/register
  test("POST /users/register - should register a new user successfully", async () => {
    const newUser = {
      userName: "johndoe",
      email: "john@example.com",
      password: "password123",
    };

    const response = await request(app)
      .post("/users/register")
      .send(newUser)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User created successfully");
    expect(response.body.user).toHaveProperty("email", "john@example.com");
    expect(response.body.user).toHaveProperty("userName", "johndoe");
    expect(response.body.user).not.toHaveProperty("password"); // Password should not be returned
  });

  // Test for: POST /users/login
  test("POST /users/login - should login an existing user successfully", async () => {
    // First, create a user
    await User.create({
      userName: "janedoe",
      email: "jane@example.com",
      password: "mypassword",
    });

    const loginCredentials = {
      email: "jane@example.com",
      password: "mypassword",
    };

    const response = await request(app)
      .post("/users/login")
      .send(loginCredentials)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.user).toHaveProperty("email", "jane@example.com");
    expect(response.body.user).not.toHaveProperty("password"); // Password should not be returned
  });

  // Test for: GET /users/:id
  test("GET /users/:id - should retrieve user by ID successfully", async () => {
    // First, create a user
    const user = await User.create({
      userName: "bobsmith",
      email: "bob@example.com",
      password: "bobpassword",
    });

    const response = await request(app)
      .get(`/users/${user._id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.user).toHaveProperty("_id", user._id.toString());
    expect(response.body.user).toHaveProperty("email", "bob@example.com");
    expect(response.body.user).toHaveProperty("userName", "bobsmith");
    expect(response.body.user).not.toHaveProperty("password"); // Password should not be returned
  });

  // New Tests

  // Test for: POST /users/register - should return error for missing fields
  test("POST /users/register - should return error for missing fields", async () => {
    const newUser = {
      userName: "johndoe",
      // Missing email
      password: "password123",
    };

    const response = await request(app)
      .post("/users/register")
      .send(newUser)
      .expect(400); // Expecting a 400 Bad Request

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email is required");
  });

  // Test for: POST /users/login - should return error for invalid credentials"
  test("POST /users/login - should return error for invalid credentials", async () => {
    // First, create a user
    await User.create({
      userName: "janedoe",
      email: "jane@example.com",
      password: "mypassword",
    });

    const loginCredentials = {
      email: "jane@example.com",
      password: "wrongpassword", // Invalid password
    };

    const response = await request(app)
      .post("/users/login")
      .send(loginCredentials)
      .expect(401); // Unauthorized

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email or password");
  });

  // Test for: POST /users/id - should return error for non-existent user
  test("GET /users/:id - should return error for non-existent user", async () => {
    const nonExistentUserId = "605c72ef1532071b31c0199f"; // Some random ID

    const response = await request(app)
      .get(`/users/${nonExistentUserId}`)
      .expect(404); // Not Found

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("User not found");
  });

  // Test for: POST /users/login - should return error for missing fields
  test("POST /users/login - should return error for missing fields", async () => {
    const loginCredentials = {
      // Missing email
      password: "mypassword",
    };

    const response = await request(app)
      .post("/users/login")
      .send(loginCredentials)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email and password are required");
  });
  
  // Test for: POST /users/logout - should logout the user successfully
  test("POST /users/logout - should logout the user successfully", async () => {
    const loginCredentials = {
      email: "jane@example.com",
      password: "mypassword",
    };

    // First login
    const loginResponse = await request(app)
      .post("/users/login")
      .send(loginCredentials)
      .expect(200);

    const response = await request(app)
      .post("/users/logout")
      .set("Authorization", `Bearer ${loginResponse.body.token}`) // Assuming token-based authentication
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Logged out successfully");
  });

});