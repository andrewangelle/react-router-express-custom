import { reactRouter } from '@react-router/dev/vite';

import { defineConfig, type Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { createRequestHandler, type ServerBuild } from 'react-router';
import { getVite } from './server/dev/vite.js'
import invariant  from './server/dev/invariant'
import { createRequest, sendResponse } from '@remix-run/node-fetch-server'
import type { ServerResponse } from "node:http";
import type * as Vite from "vite";

function create(name:string) {
  let id = `virtual:react-router/${name}`;
  return {
    id,
    resolvedId: `\0${id}`,
    url: `/@id/__x00__${id}`
  };
}

const virtual = {
  serverBuild: create("server-build"),
  serverManifest: create("server-manifest"),
  browserManifest: create("browser-manifest")
};

function fromNodeRequest(
  nodeReq: Vite.Connect.IncomingMessage,
  nodeRes: ServerResponse<Vite.Connect.IncomingMessage>,
) {
  invariant(
    nodeReq.originalUrl,
    "Expected `nodeReq.originalUrl` to be defined"
  );
  nodeReq.url = nodeReq.originalUrl;
  return createRequest(nodeReq, nodeRes);
}

const plugin = (): Plugin => {
  return  {
      name: "my cusotm config",
      async configureServer(viteDevServer) {
        return () => {
          if (!viteDevServer.config.server.middlewareMode) {
            viteDevServer.middlewares.use(async (req, res, next) => {
              try {
                let build;
                const unstable_viteEnvironmentApi = false //this needs to come from rr config.ts
                if (unstable_viteEnvironmentApi) {
                  let vite2 = getVite();
                  let ssrEnvironment = viteDevServer.environments.ssr;
                  if (!vite2.isRunnableDevEnvironment(ssrEnvironment)) {
                    next();
                    return;
                  }
                  build = await ssrEnvironment.runner.import(
                    virtual.serverBuild.id
                  );
                } else {
                  build = await viteDevServer.ssrLoadModule(
                    virtual.serverBuild.id
                  ) as ServerBuild;
                }
                let handler = createRequestHandler(build, "development");

                let nodeHandler = async (
                  nodeReq: Vite.Connect.IncomingMessage,
                  nodeRes: ServerResponse<Vite.Connect.IncomingMessage>,
                ) => {
                  const isPostRenderRequest = nodeReq.method === 'POST' && 
                    !nodeReq.url?.startsWith('/api/service/resources');

                  if(isPostRenderRequest) {
                    nodeReq.method = 'GET'
                  }
                  const reactRouterDevLoadContext = () => {}
                  let req2 = fromNodeRequest(nodeReq, nodeRes);
                  let res2 = await handler(
                    req2,
                    // @ts-expect-error
                    await reactRouterDevLoadContext(req2)
                  );
                  await sendResponse(nodeRes, res2);
                }
              
                await nodeHandler(req, res);
              } catch (error) {
                next(error);
              }
            });
          }
        }
      }
    }
  
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [plugin(), reactRouter(), tsconfigPaths()],
    base: mode === 'production' ? '/api/service/' : '',
  }
});
// line 3433
// node_modules/@react-router/dev/dist/vite.js