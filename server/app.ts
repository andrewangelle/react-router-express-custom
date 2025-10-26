import { existsSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import morgan from 'morgan';
import sourceMapSupport from 'source-map-support';
import type { ViteDevServer } from 'vite';
import { createReactRouterRequestHandler } from './handler.js';

let viteDevServer: ViteDevServer | undefined;

if (process.env.NODE_ENV !== 'production') {
  const vite = await import('vite');
  viteDevServer = await vite.createServer({
    server: { middlewareMode: true },
  });
}

sourceMapSupport.install({ retrieveSourceMap });

startServer();

function parseNumber(raw?: string) {
  if (raw === undefined) return undefined;
  const maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

async function getBuild() {
  if (viteDevServer) {
    return viteDevServer.ssrLoadModule('virtual:react-router/server-build');
  }

  // @ts-expect-error: In production the path will be relative to /build
  return await import('./server/index.js');
}

function retrieveSourceMap(source: string) {
  const match = source.startsWith('file://');
  if (match) {
    const filePath = fileURLToPath(source);
    const sourceMapPath = `${filePath}.map`;
    if (existsSync(sourceMapPath)) {
      return {
        url: source,
        map: readFileSync(sourceMapPath, 'utf8'),
      };
    }
  }
  return null;
}

function getAddress() {
  if (process.env.HOST) return process.env.HOST;
  return Object.values(networkInterfaces())
    .flat()
    .find((ip) => String(ip?.family).includes('4') && !ip?.internal)?.address;
}

async function startServer() {
  const port = parseNumber(process.env.PORT) ?? (await getPort({ port: 8080 }));
  const address = getAddress();
  const build = await getBuild();
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
    createReactRouterRequestHandler({
      build,
      mode: process.env.NODE_ENV ?? 'development',
    }),
  );

  const onListen = () => {
    if (!address) {
      console.log(`[ee-ssr] http://localhost:${port}`);
    } else {
      console.log(
        `[ee-ssr] http://localhost:${port} (http://${address}:${port})`,
      );
    }
  };

  if (process.env.HOST) {
    app.listen(port, process.env.HOST, onListen);
  } else {
    app.listen(port, onListen);
  }
}
