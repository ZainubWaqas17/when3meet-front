const express = require("express");
const availability_routes = require("./routes/availability_routes");
const event_routes = require("./routes/event_routes");
const user_routes = require("./routes/user_routes");
const User = require("./models/user_model");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use("/api/events", event_routes);
app.use("/api", availability_routes);
app.use("/api/users", user_routes);

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
