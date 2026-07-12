/**
 * local server entry file, for local development
 */
import app from './app.js';
import { startPaymentScheduler } from './payment/scheduler.js';
import { ensureReady } from './db/store.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

// 启动支付定时任务（超时关单）
startPaymentScheduler();

// 冷启动准备：本地负责种子，云端负责从库 hydrate + 种子
await ensureReady();

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