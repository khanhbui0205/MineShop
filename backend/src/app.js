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
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://mineshop.khanhbui0205.workers.dev",
  "https://cloudflare-workers-autoconfig-mineshop.khanhbui0205.workers.dev" // Origin thực tế mới
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Xử lý thêm preflight OPTIONS (Tương thích tốt nhất với Express 5)
app.options('*', cors());

// Middleware normalize multiple slashes (e.g. //api -> /api)
app.use((req, res, next) => {
  req.url = req.url.replace(/\/+/g, '/');
  next();
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin/server-control', serverControlRoutes);
app.use('/api/minecraft', minecraftRoutes);

// Health check (old root)
app.get('/', (req, res) => {
  res.json({ message: 'MineShop API đang hoạt động', version: '2.0.0' });
});

// Health check API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: "ok"
  });
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
