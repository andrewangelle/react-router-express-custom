#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import { createRequestListener } from '@mjackson/node-fetch-server';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import morgan from 'morgan';
import type { ServerBuild } from 'react-router';
import sourceMapSupport from 'source-map-support';
import { createExpressRequestHandler } from './handler.js';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';

sourceMapSupport.install({
  retrieveSourceMap: (source) => {
    const match = source.startsWith('file://');
    if (match) {
      const filePath = url.fileURLToPath(source);
      const sourceMapPath = `${filePath}.map`;
      if (fs.existsSync(sourceMapPath)) {
        return {
          url: source,
          map: fs.readFileSync(sourceMapPath, 'utf8'),
        };
      }
    }
    return null;
  },
});

run();

type RSCServerBuild = {
  fetch: (request: Request) => Response;
  publicPath: string;
  assetsBuildDirectory: string;
};

function isRSCServerBuild(
  build: ServerBuild | RSCServerBuild,
): build is RSCServerBuild {
  return 'fetch' in build && typeof build.fetch === 'function';
}

function parseNumber(raw?: string) {
  if (raw === undefined) return undefined;
  const maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

async function run() {
  const port = parseNumber(process.env.PORT) ?? (await getPort({ port: 8080 }));

  const buildPathArg = './build/server/index.js';

  if (!buildPathArg) {
    console.error(`
  Usage: react-router-serve <server-build-path> - e.g. react-router-serve build/server/index.js`);
    process.exit(1);
  }

  const buildPath = path.resolve(buildPathArg);

  const buildModule = await import(url.pathToFileURL(buildPath).href);
  let build: ServerBuild | RSCServerBuild;

  if (buildModule.default && typeof buildModule.default === 'function') {
    const config = {
      publicPath: '/',
      assetsBuildDirectory: '../client',
      ...(buildModule.unstable_reactRouterServeConfig || {}),
    };
    build = {
      fetch: buildModule.default,
      publicPath: config.publicPath,
      assetsBuildDirectory: path.resolve(
        path.dirname(buildPath),
        config.assetsBuildDirectory,
      ),
    } satisfies RSCServerBuild;
  } else {
    build = buildModule as ServerBuild;
  }

  const onListen = () => {
    const address =
      process.env.HOST ||
      Object.values(os.networkInterfaces())
        .flat()
        .find((ip) => String(ip?.family).includes('4') && !ip?.internal)
        ?.address;

    if (!address) {
      console.log(`[react-router-serve] http://localhost:${port}`);
    } else {
      console.log(
        `[react-router-serve] http://localhost:${port} (http://${address}:${port})`,
      );
    }
  };

  const app = express();
  app.disable('x-powered-by');

  if (!isRSCServerBuild(build)) {
    app.use(compression());
  }

  app.use(
    path.posix.join(build.publicPath, 'assets'),
    express.static(path.join(build.assetsBuildDirectory, 'assets'), {
      immutable: true,
      maxAge: '1y',
    }),
  );
  app.use(build.publicPath, express.static(build.assetsBuildDirectory));
  app.use(express.static('public', { maxAge: '1h' }));
  app.use(morgan('tiny'));

  if (isRSCServerBuild(build)) {
    app.all('*', createRequestListener(build.fetch));
  } else {
    app.use(
      '*',
      createExpressRequestHandler({
        build,
        mode: process.env.NODE_ENV,
      }),
    );
  }

  const server = process.env.HOST
    ? app.listen(port, process.env.HOST, onListen)
    : app.listen(port, onListen);

  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.once(signal, () => server?.close(console.error));
  });
}
