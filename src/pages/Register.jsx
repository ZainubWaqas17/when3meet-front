// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:50001');

export default function Register() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (!userName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Registration failed.");
        return;
      }

      // Optionally log them in right away:
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");
      
      const returnTo = localStorage.getItem('returnTo');
      if (returnTo) {
        localStorage.removeItem('returnTo');
        navigate(returnTo);
      } else {
        navigate("/home");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="page">
      <div className="bottom-decor">
        <div className="flower-gradient"></div>
        <img
          src="/image.png"
          alt="Lavender Field"
          className="bottom-flowers"
        />
      </div>

      <div className="content">
        <header className="header">
          <img src="/logo.png" alt="When3Meet Logo" className="logo" />
          <h1>When3Meet</h1>
        </header>

        <form className="login-form" onSubmit={handleRegister}>
          <h2>Create your account</h2>
          <p>Sign up to start planning your meetings.</p>

          <label>
            Name
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
            />
          </label>

          {error && (
            <p style={{ color: "crimson", margin: "4px 0", fontSize: 14 }}>
              {error}
            </p>
          )}

          <button type="submit">Register</button>

          <p>
            Already have an account?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
