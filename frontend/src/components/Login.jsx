import React, { useState } from 'react';
import axios from 'axios';
import * as jwt_decode from 'jwt-decode';  // Correct import

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
      const decoded = jwt_decode(token); // Use the correct function
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