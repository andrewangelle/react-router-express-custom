import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import type { ServerBuild } from 'react-router';
import { createRequestHandler } from './handler.js';

const viteDevServer =
  process.env.NODE_ENV === 'production'
    ? undefined
    : await import('vite').then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      );

const reactRouterHandler = createRequestHandler({
  build: (viteDevServer
    ? () => viteDevServer.ssrLoadModule('virtual:react-router/server-build')
    : // @ts-expect-error: In production the path will be relative to /build
      await import('./server/index.js')) as () => Promise<ServerBuild>,
});
const app = express();

app.use(compression());
app.disable('x-powered-by');

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    '/assets',
    express.static('build/client/assets', { immutable: true, maxAge: '1y' }),
  );
}

app.use(express.static('build/client', { maxAge: '1h' }));
app.use(morgan('tiny'));

// Handle POST requests for route rendering
app.post('*', reactRouterHandler);
// Handle all other requests (GET, PUT, DELETE, etc.)
app.use('*', reactRouterHandler);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`),
);
