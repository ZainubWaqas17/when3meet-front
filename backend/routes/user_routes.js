const router = require("express").Router();
const userCtrl = require("../controllers/user_controllers");

router.post("/register", userCtrl.createUser); // POST /users/register
router.post("/login", userCtrl.loginUser);     // POST /users/login
router.post("/google", userCtrl.googleLogin);  // POST /users/google
router.get("/:id", userCtrl.getUserById);      // GET /users/:id

router.get("/", (_, res) => {                // GET /users/
  res.status(200).json({ message: "User API connected successfully" });
});

module.exports = router;

/*
## Key Security Features:

1. **Bcrypt Hashing**: Passwords are hashed using bcrypt with a salt factor of 10
2. **Pre-save Hook**: Automatically hashes passwords before saving to database
3. **Password Comparison**: Secure method to compare plain-text passwords with hashed ones
4. **Never Return Passwords**: Password field is excluded from API responses
5. **Validation**: Email and username validation with unique constraints

## Usage Example:

## Body must be JSON format!!!!!!!!!

**Register:**
POST http://localhost:PORT/users/register
Body: {
  "userName": "john_doe",
  "email": "john@example.com",
  "password": "mySecurePass123"
}


**Login:**
POST http://localhost:PORT/users/login
Body: {
  "email": "john@example.com",
  "password": "mySecurePass123"
}
*/