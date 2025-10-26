import { join, posix } from 'node:path';
import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import type { ViteDevServer } from 'vite';
import { createExpressRequestHandler } from './handler.js';

let viteDevServer: ViteDevServer | undefined;

if (process.env.NODE_ENV !== 'production') {
  const vite = await import('vite');

  viteDevServer = await vite.createServer({
    server: { middlewareMode: true },
  });
}

const port = Number(`${process.env.PORT ?? 8080}`);

const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule('virtual:react-router/server-build')
  : // @ts-expect-error: path will be relative to /build directory in production
    await import('./server/index.js');

const app = express();
app.disable('x-powered-by');
app.use(compression());

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    posix.join(build.publicPath, 'assets'),
    express.static(join(build.assetsBuildDirectory, 'assets'), {
      immutable: true,
      maxAge: '1y',
    }),
  );
}

app.use(morgan('tiny'));
app.all(
  '*',
  createExpressRequestHandler({
    build,
    mode: process.env.NODE_ENV ?? 'development',
  }),
);

app.listen(port, () => {
  console.log(`[ee-ssr] running on port ${port}`);
});
