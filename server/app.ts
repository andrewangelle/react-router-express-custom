import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import { createReactRouterRequestHandler } from './handler.js';



const viteDevServer =
  process.env.NODE_ENV === 'production'
    ? undefined
    : await import('vite').then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      );

async function getBuild() {
  if(viteDevServer) {
    return viteDevServer.ssrLoadModule('virtual:react-router/server-build')
  }

  // @ts-expect-error: In production the path will be relative to /build
  return import('./server/index.js')
}

const requestHandler = createReactRouterRequestHandler({
  build: await getBuild()
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
app.post('*', requestHandler);
// Handle all other requests (GET, PUT, DELETE, etc.)
app.use('*', requestHandler);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`),
);
