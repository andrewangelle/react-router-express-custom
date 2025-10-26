import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import { createReactRouterRequestHandler } from './handler.js';

async function getDevServer() {
  if (process.env.NODE_ENV === 'production') {
    return undefined;
  }

  const vite = await import('vite');
  const server = await vite.createServer({
    server: { middlewareMode: true },
  });
  return server;
}

const viteDevServer = await getDevServer();

async function getBuild() {
  if (viteDevServer) {
    return viteDevServer.ssrLoadModule('virtual:react-router/server-build');
  }

  // @ts-expect-error: In production the path will be relative to /build
  return await import('./server/index.js');
}

const build = await getBuild();

const requestHandler = createReactRouterRequestHandler({
  build,
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

app.use('*', requestHandler);

const port = process.env.PORT || 8080;

app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`),
);
