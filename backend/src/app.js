const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const storeRoutes = require('./routes/storeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const packageRoutes = require('./routes/packageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const serverControlRoutes = require('./routes/admin/serverControlRoutes');
const minecraftRoutes = require('./routes/minecraftRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const redeemRoutes = require('./routes/redeemRoutes');
const { protect } = require('./middleware/authMiddleware');
const { getProfile } = require('./controllers/userController');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security headers
app.use(helmet());

// Enable CORS with dynamic origin support
const allowedOrigins = [
  process.env.FRONTEND_URL_DEV,
  process.env.FRONTEND_URL_PROD,
  "http://localhost:5173",
  "https://mineshop.khanhbui0205.workers.dev"
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    } else {
      console.log('Origin not allowed by CORS:', origin);
      return callback(new Error('CORS not allowed'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// CORS isAlready handled by app.use(cors(...)) above.

// Middleware normalize multiple slashes (e.g. //api -> /api)
app.use((req, res, next) => {
  req.url = req.url.replace(/\/+/g, '/');
  next();
});

// Create a main router for all API endpoints
const apiRouter = express.Router();

// Mount all feature routers to the main apiRouter
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/store', storeRoutes);
apiRouter.use('/admin/server-control', serverControlRoutes); // Move more specific one up if needed
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/packages', packageRoutes);
apiRouter.use('/payment', paymentRoutes);
apiRouter.use('/payos', paymentRoutes);
apiRouter.use('/minecraft', minecraftRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/redeem', redeemRoutes);
apiRouter.get('/profile', protect, getProfile);

// Health check inside apiRouter
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    status: "ok",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Use the main apiRouter with and without /api prefix
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Health check (old root)
app.get('/', (req, res) => {
  res.json({ message: 'MineShop API đang hoạt động', version: '2.0.0' });
});



// Error handler middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

module.exports = app;
