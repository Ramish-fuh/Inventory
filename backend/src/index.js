import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';
// import bcrypt from 'bcryptjs';
// import User from '../models/User.js';

dotenv.config();
connectDB();

// define the default user creation function
// const createDefaultUser = async () => {
//   try {
//     const existing = await User.findOne({ username: 'admin' });
//     if (!existing) {
//       const hashedPassword = await bcrypt.hash('admin123', 10);
//       await User.create({
//         username: 'admin',
//         fullName: 'Default Admin',
//         email: 'admin@example.com',
//         passwordHash: hashedPassword,
//         role: 'Admin'
//       });
//       console.log('✅ Default admin user created: admin / admin123');
//     } else {
//       console.log('ℹ️ Default admin user already exists.');
//     }
//   } catch (error) {
//     console.error('❌ Error creating default admin user:', error.message);
//   }
// };

// createDefaultUser();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use('/api/auth', authRoutes);

app.use(authMiddleware); // all routes after this require login

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});