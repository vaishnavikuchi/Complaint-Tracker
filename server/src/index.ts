import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Complaint Tracker API Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Complaints API: http://localhost:${PORT}/api/complaints`);
  console.log(`====================================================`);
});
