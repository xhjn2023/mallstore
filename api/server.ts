/**
 * local server entry file, for local development
 */
import app from './app.js';
import { startPaymentScheduler } from './payment/scheduler.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

// 启动支付定时任务（超时关单）
startPaymentScheduler();

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;