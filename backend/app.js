const express = require("express");
const availability_routes = require("./routes/availability_routes");
const event_routes = require("./routes/event_routes");
const user_routes = require("./routes/user_routes");
const User = require("./models/user_model");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

const testUser = {
  email: "xingyu@test.com",
  password: "test123",
  userName: "xingyu"
};

app.post("/api/users/login", async (req, res, next) => {
  const { email, password } = req.body;
  
  if (email === testUser.email && password === testUser.password) {
    try {
      let user = await User.findOne({ email: testUser.email });
      
      if (!user) {
        user = new User({
          email: testUser.email,
          password: testUser.password,
          userName: testUser.userName
        });
        await user.save();
      }
      
      return res.json({
        success: true,
        user: {
          email: testUser.email,
          userName: testUser.userName
        }
      });
    } catch (error) {
      console.error("Error with test user:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
  
  next();
});

app.use("/api/events", event_routes);
app.use("/api", availability_routes);
app.use("/api/users", user_routes);
app.use("/users", user_routes);

app.get("/test", (req, res) => {
  res.send("success")
});
app.post("/test/post", (req, res) => {
  const { email, password } = req.body;
  
  console.log("Received:", req.body);
  
  // Echo back with additional info
  res.json({
    success: true,
    message: "Echo response",
    receivedData: {
      email: email,
      password: password
    }
  });
});

module.exports = app;
