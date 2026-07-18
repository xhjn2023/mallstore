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

// 冷启动准备：后台执行，失败不致命。
// 之前这里用顶层 await，一旦 DATABASE_URL 配错 / Supabase 连不上，
// 进程直接退出 → 容器崩溃 → 小程序 callContainer 表现为「超时 / 连不上」。
// 改为非阻塞：容器必定起来（健康检查 /api/health 通过），
// DB 就绪由 store 层后台自动重试（见 store.ts scheduleRetry）。
ensureReady().catch((e) => {
  console.error(
    '[store] 冷启动准备失败，服务以降级模式启动（DB 未就绪），将在后台自动重试:',
    (e as Error)?.message || e,
  );
});

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