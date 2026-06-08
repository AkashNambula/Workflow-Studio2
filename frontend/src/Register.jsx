import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Register() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Operator");
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async () => {

    // Name validation
    if (!name) {
      setRegisterMessage("Please enter your name");
      setRegisterSuccess(false);
      return;
    }

    // Email validation
    if (!email.includes("@gmail.com")) {
      setRegisterMessage("Enter valid Gmail address");
      setRegisterSuccess(false);
      return;
    }

    // Phone validation
    if (!/^[0-9]{10}$/.test(phone)) {
      setRegisterMessage("Phone number must be 10 digits");
      setRegisterSuccess(false);
      return;
    }

    // Password validation
    if (password.length < 6) {
      setRegisterMessage("Password must be at least 6 characters");
      setRegisterSuccess(false);
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setRegisterMessage("Passwords do not match");
      setRegisterSuccess(false);
      return;
    }

    try {

      await axios.post(
        "http://127.0.0.1:8000/register",
       {
  name,
  email,
  phone,
  password,
  role
}
      );

      setRegisterMessage("Successfully Registered");
      setRegisterSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (error) {

      setRegisterMessage("Registration Failed");
      setRegisterSuccess(false);

      console.error(error);
    }
  };

  return (
    <div style={container}>

      <div style={card}>

        <h1 style={title}>
          HR AUTOMATION REGISTER
        </h1>

        {registerMessage && (
          <p
            style={{
              color: registerSuccess ? "#22c55e" : "#ef4444",
              marginBottom: "18px",
              fontWeight: "700",
              fontSize: "15px"
            }}
          >
            {registerMessage}
          </p>
        )}

        <input
          type="text"
          placeholder="Enter Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={input}
        />

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          type="text"
          placeholder="Enter Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={input}
        />
  <select
  value={role}
  onChange={(e) => setRole(e.target.value)}
  style={input}
>
  <option value="Operator">Operator</option>
  <option value="Viewer">Viewer</option>
</select>

        <button
          onClick={handleRegister}
          style={button}
        >
          Register
        </button>

        <p style={text}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#8b5cf6",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Login here
          </Link>
        </p>

      </div>

    </div>
  );
}

const container = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #020617, #0f172a)",
  margin: 0,
  padding: 0
};

const card = {
  background: "#0f172a",
  padding: "40px",
  borderRadius: "20px",
  width: "420px",
  textAlign: "center",
  border: "1px solid #1e293b",
  boxShadow: "0 10px 40px rgba(0,0,0,0.6)"
};

const title = {
  fontSize: "32px",
  fontWeight: "800",
  color: "#ffffff",
  marginBottom: "28px",
  letterSpacing: "1px"
};

const input = {
  width: "100%",
  padding: "15px",
  marginBottom: "18px",
  borderRadius: "12px",
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none"
};

const button = {
  width: "100%",
  padding: "15px",
  background: "linear-gradient(90deg, #7c3aed, #9333ea)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "700"
};

const text = {
  marginTop: "20px",
  color: "#cbd5e1",
  fontSize: "15px"
};

export default Register;