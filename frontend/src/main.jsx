import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./Login";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            localStorage.getItem("token")
              ? <App />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/dashboard"
          element={
            localStorage.getItem("token")
              ? <App />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/*"
          element={
            localStorage.getItem("token")
              ? <App />
              : <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);