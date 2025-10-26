import { existsSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import morgan from 'morgan';
import sourceMapSupport from 'source-map-support';
import { createReactRouterRequestHandler } from './handler.js';

const viteDevServer = await getDevServer();
sourceMapSupport.install({ retrieveSourceMap });
startServer();

function parseNumber(raw?: string) {
  if (raw === undefined) return undefined;
  const maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

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

async function startServer() {
  function onListen() {
    const address =
      process.env.HOST ||
      Object.values(networkInterfaces())
        .flat()
        .find((ip) => String(ip?.family).includes('4') && !ip?.internal)
        ?.address;

    if (!address) {
      console.log(`[ee-ssr-serve] http://localhost:${port}`);
    } else {
      console.log(
        `[ee-ssr-serve] http://localhost:${port} (http://${address}:${port})`,
      );
    }
  }

  const port = parseNumber(process.env.PORT) ?? (await getPort({ port: 8080 }));
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
    }),
  );
  app.listen(port, onListen);
}
