const dotenv = require('dotenv');
// Load env vars
dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
  // Initialize Cron Jobs
  const { initCronJobs } = require('./src/utils/cronJobs');
  initCronJobs();
});

// Thêm đoạn log này ở file server.js
process.on('uncaughtException', (err) => {
  console.error('\n--- FATAL ERROR: UNCAUGHT EXCEPTION ---');
  console.error('File gây lỗi/Dòng code:', err.stack);
  console.error('Nội dung lỗi:', err.message);
  process.exit(1); 
});

