import { serve } from '@hono/node-server';
import app from './src/index';

const port = process.env.PORT ? Number(process.env.PORT) : 8787;

serve({ fetch: (request) => app.fetch(request, process.env), port }, (info) => {
  console.log(`cargo-find worker on http://localhost:${info.port}`);
});
