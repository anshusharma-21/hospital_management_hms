const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Centralized config validation
const { getJwtSecret } = require('./config/jwt');
try {
  getJwtSecret();
} catch (configErr) {
  console.error('[Startup Failure]:', configErr.message);
  process.exit(1);
}

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/tenants', require('./routes/tenantRoutes'));
app.use('/api/v1/patients', require('./routes/patientRoutes'));
app.use('/api/v1/appointments', require('./routes/appointmentRoutes'));
app.use('/api/v1/clinical', require('./routes/clinicalRoutes'));
app.use('/api/v1/diagnostics', require('./routes/labRoutes'));
app.use('/api/v1/pharmacy', require('./routes/pharmacyRoutes'));
app.use('/api/v1/billing', require('./routes/billingRoutes'));
app.use('/api/v1/ipd', require('./routes/ipdRoutes'));
app.use('/api/v1/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/v1/saas', require('./routes/saasPlatformRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/references', require('./routes/referenceRoutes'));
app.use('/api/v1/documents', require('./routes/documentRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    product: 'Hospital Vision SaaS',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    architecture: 'MERN Modular Monolith'
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 HOSPITAL VISION BACKEND API RUNNING ON PORT ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]:', err.message);
});

module.exports = server;
