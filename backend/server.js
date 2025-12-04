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

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Test user for regular login
// const testUser = {
//     email: "ggoel@test.com",
//     password: "test123",
//     userName: "ggoel"
// };

// // Regular login endpoint
// app.post('/users/login', async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         if (email === testUser.email && password === testUser.password) {
//             await db.collection('users').updateOne(
//                 { email: testUser.email },
//                 {
//                     $set: {
//                         email: testUser.email,
//                         userName: testUser.userName,
//                         loginMethod: 'regular',
//                         lastLogin: new Date()
//                     }
//                 },
//                 { upsert: true }
//             );

//             console.log(`User ${testUser.email} logged in and stored in database`);

//             res.json({
//                 success: true,
//                 user: {
//                     email: testUser.email,
//                     userName: testUser.userName
//                 }
//             });
//         } else {
//             res.status(401).json({
//                 success: false,
//                 message: 'Invalid email or password'
//             });
//         }
//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error'
//         });
//     }
// });

// Google OAuth login endpoint

app.post("/auth/google", async (req, res) => {
  try {
    const { id_token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    await db.collection("users").updateOne(
      { email: email },
      {
        $set: {
          email: email,
          userName: name,
          picture: picture,
          googleId: googleId,
          loginMethod: "google",
          lastLogin: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`Google user ${email} logged in and stored in database`);

    res.json({
      success: true,
      user: {
        email,
        userName: name,
        picture,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid Google token",
    });
  }
});

// // Save availability endpoint
// app.post('/availability', async (req, res) => {
//     console.log('Received availability request:', req.body);

//     try {
//         if (!db) {
//             return res.status(500).json({
//                 success: false,
//                 message: 'Database not connected'
//             });
//         }

//         const { eventKey, name, selectedByDay, userEmail } = req.body;

//         if (!eventKey || !name) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Missing required fields: eventKey and name'
//             });
//         }

//         const availabilityData = {
//             eventKey,
//             name,
//             selectedByDay: selectedByDay || {},
//             userEmail: userEmail || 'anonymous',
//             timestamp: new Date()
//         };

//         console.log('Saving availability data:', availabilityData);

//         const result = await db.collection('availability').insertOne(availabilityData);

//         console.log(`✅ Availability saved successfully for ${name} in event ${eventKey}`);

//         res.json({
//             success: true,
//             id: result.insertedId
//         });
//     } catch (error) {
//         console.error('❌ Error saving availability:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to save availability'
//         });
//     }
// });

// // Get availability for an event
// app.get('/availability/:eventKey', async (req, res) => {
//     try {
//         const { eventKey } = req.params;
//         const availability = await db.collection('availability').find({ eventKey }).toArray();
//         res.json({ availability });
//     } catch (error) {
//         console.error('Error fetching availability:', error);
//         res.status(500).json({ error: 'Failed to fetch availability' });
//     }
// });

// // Create meeting endpoint
// app.post('/meetings', async (req, res) => {
//     console.log('Received meeting creation request:', req.body);

//     try {
//         const { title, description, startTime, endTime, selectedDays, month, year, creatorEmail } = req.body;

//         const meetingData = {
//             title,
//             description: description || '',
//             startTime,
//             endTime,
//             selectedDays,
//             month,
//             year,
//             creatorEmail: creatorEmail || 'anonymous',
//             createdAt: new Date()
//         };

//         console.log('Saving meeting data:', meetingData);

//         const result = await db.collection('meetings').insertOne(meetingData);
//         console.log(`✅ Meeting '${title}' created successfully`);

//         res.json({
//             success: true,
//             id: result.insertedId,
//             meeting: meetingData
//         });
//     } catch (error) {
//         console.error('❌ Error creating meeting:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to create meeting'
//         });
//     }
// });

// // Get all meetings
// app.get('/meetings', async (req, res) => {
//     try {
//         const meetings = await db.collection('meetings').find({}).toArray();
//         res.json({ meetings });
//     } catch (error) {
//         console.error('Error fetching meetings:', error);
//         res.status(500).json({ error: 'Failed to fetch meetings' });
//     }
// });

// // Get users
// app.get('/users', async (req, res) => {
//     try {
//         const users = await db.collection('users').find({}).toArray();
//         res.json({ users });
//     } catch (error) {
//         console.error('Error fetching users:', error);
//         res.status(500).json({ error: 'Failed to fetch users' });
//     }
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
