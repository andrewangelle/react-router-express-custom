import arg from 'arg';
import colors from 'picocolors';
import type * as Vite from 'vite';
import * as profiler from './profiler.js';
import { getVite, preloadVite } from './vite.js';

export type ViteDevOptions = {
  clearScreen?: boolean;
  config?: string;
  cors?: boolean;
  force?: boolean;
  host?: boolean | string;
  logLevel?: Vite.LogLevel;
  mode?: string;
  open?: boolean | string;
  port?: number;
  strictPort?: boolean;
  profile?: boolean;
};

export async function dev(
  root: string,
  {
    clearScreen,
    config: configFile,
    cors,
    force,
    host,
    logLevel,
    mode,
    open,
    port,
    strictPort,
  }: ViteDevOptions,
) {
  // Ensure Vite's ESM build is preloaded at the start of the process
  // so it can be accessed synchronously via `getVite`
  await preloadVite();
  const vite = getVite();

  const server = await vite.createServer({
    root,
    mode,
    configFile,
    server: { open, cors, host, port, strictPort },
    optimizeDeps: { force },
    clearScreen,
    logLevel,
  });

  if (
    !server.config.plugins.find(
      (plugin) =>
        plugin.name === 'react-router' || plugin.name === 'react-router/rsc',
    )
  ) {
    console.error(
      colors.red('React Router Vite plugin not found in Vite config'),
    );
    process.exit(1);
  }

  await server.listen();
  server.printUrls();

  const customShortcuts: Vite.CLIShortcut<typeof server>[] = [
    {
      key: 'p',
      description: 'start/stop the profiler',
      async action(server) {
        if (profiler.getSession()) {
          await profiler.stop(server.config.logger.info);
        } else {
          await profiler.start(() => {
            server.config.logger.info('Profiler started');
          });
        }
      },
    },
  ];

  server.bindCLIShortcuts({ print: true, customShortcuts });
}

const argv = process.argv.slice(2);

const isBooleanFlag = (arg: string) => {
  const index = argv.indexOf(arg);
  const nextArg = argv[index + 1];
  return !nextArg || nextArg.startsWith('-');
};
const args = arg(
  {
    '--force': Boolean,
    '--help': Boolean,
    '-h': '--help',
    '--json': Boolean,
    '--token': String,
    '--typescript': Boolean,
    '--no-typescript': Boolean,
    '--version': Boolean,
    '-v': '--version',
    '--port': Number,
    '-p': '--port',
    '--config': String,
    '-c': '--config',
    '--assetsInlineLimit': Number,
    '--clearScreen': Boolean,
    '--cors': Boolean,
    '--emptyOutDir': Boolean,
    '--host': isBooleanFlag('--host') ? Boolean : String,
    '--logLevel': String,
    '-l': '--logLevel',
    '--minify': String,
    '--mode': String,
    '-m': '--mode',
    '--open': isBooleanFlag('--open') ? Boolean : String,
    '--strictPort': Boolean,
    '--profile': Boolean,
    '--sourcemapClient': isBooleanFlag('--sourcemapClient') ? Boolean : String,
    '--sourcemapServer': isBooleanFlag('--sourcemapServer') ? Boolean : String,
    '--watch': Boolean,
  },
  {
    argv,
  },
);

const flags = Object.entries(args).reduce((acc, [key, value]) => {
  key = key.replace(/^--/, '');
  // @ts-expect-error
  acc[key] = value;
  return acc;
}, {} as ViteDevOptions);

dev(process.cwd(), flags);
