const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Environment variables (secret keys) ko load karne ke liye
dotenv.config();

// Database connect logic
const connectDB = require('./config/db');
connectDB();

const app = express();

app.use(express.json());
app.use(cors()); 

// --- ROUTES IMPORTS ---
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');

// --- ROUTES USE KAREIN ---
app.use('/api/auth', authRoutes);
app.use('/api/document', documentRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Hello Bro! LegalMind API Gateway is running smoothly! 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend API Gateway is running on port: http://localhost:${PORT}`);
});

