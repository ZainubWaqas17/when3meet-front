const { OAuth2Client } = require("google-auth-library");
const mongoose = require('mongoose');
const dotenv = require("dotenv").config();
const app = require("./app");


const PORT = process.env.PORT || 50001;

// Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// MongoDB connection
const dbName = 'when3meet'
mongoose.connect(process.env.MONGODB_URI, {
  dbName: dbName, // Explicitly specify the database name
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log(`Connected to MongoDB; Database: ${dbName}`);
})
.catch((error) => {
  console.error("MongoDB connection error:", error);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
