'use strict';

require('dotenv').config();
const app = require('./src/app');
const cronJobs = require('./src/jobs');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server berjalan di port ${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV}`);
  cronJobs.startAll();
  console.log('⏰ Cron jobs aktif');
});
