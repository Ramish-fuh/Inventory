import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import logRoutes from './routes/logRoutes.js';
import { generateQRCode } from './utils/genQr.js';
import authMiddleware from './middleware/authMiddleware.js';
import logger from './utils/logger.js';

dotenv.config();
connectDB();



const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use('/api/auth', authRoutes);

app.use(authMiddleware); // all routes after this require login

app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes); 
app.use('/api/logs', logRoutes);
app.use('/api/qr', generateQRCode); 

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});