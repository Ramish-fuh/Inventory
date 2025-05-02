import React, { useState } from 'react';
import axios from 'axios';

// Replace `jwtDecode` with a custom function to decode JWT tokens
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1]; // Get the payload part of the JWT
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Replace URL-safe characters
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    return JSON.parse(jsonPayload); // Parse the JSON payload
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        username,
        password,
      });

      const token = response.data.token;
      // Save the token in localStorage
      localStorage.setItem('token', token);

      // Decode the token to get the user's role
      const decoded = token ? decodeJWT(token) : null; // Use the custom function
      const userRole = decoded.role;

      // Store the user's role in localStorage
      localStorage.setItem('userRole', userRole);

      // Redirect user based on role
      if (userRole === 'admin') {
        window.location.href = '/admin-dashboard';
      } else {
        window.location.href = '/user-dashboard';
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;