import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { postcardRouter } from './routes/postcard.routes.js';
import { meetupRouter } from './routes/meetup.routes.js';
import { coachRouter } from './routes/coach.routes.js';
import { groupRouter } from './routes/group.routes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint (accessible at /health and /api/health)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    service: 'Hereabouts Backend Service',
    anti_instagram_philosophy: 'Post less. Go somewhere. Meet someone.',
    demo_mode: config.allowDemoMode,
    timestamp: new Date().toISOString(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Register routers
app.use('/api/postcard', postcardRouter);
app.use('/api/meetup', meetupRouter);
app.use('/api/coach', coachRouter);
app.use('/api/group', groupRouter);

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`[Hereabouts] Backend API running at http://localhost:${config.port}`);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  (module.exports as any).default = app;
  (module.exports as any).app = app;
}

export default app;
