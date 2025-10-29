import path from 'pathe';

import invariant from './invariant.js';
import { isReactRouterRepo } from './is-react-router-repo.js';

type Vite = typeof import('vite');
let vite: Vite | undefined;

const viteImportSpecifier = isReactRouterRepo()
  ? // Support testing against different versions of Vite by ensuring that Vite
    // is resolved from the current working directory when running within this
    // repo. If we don't do this, Vite will always be imported relative to this
    // file, which means that it will always resolve to Vite 6.
    `file:///${path
      .normalize(
        import.meta.resolve('vite/package.json', { paths: [process.cwd()] }),
      )
      .replace('package.json', 'dist/node/index.js')}`
  : 'vite';

export async function preloadVite(): Promise<void> {
  // Use a dynamic import to force Vite to use the ESM build. If we don't do
  // this, Vite logs CJS deprecation warnings.
  vite = await import(viteImportSpecifier);
}

export function getVite(): Vite {
  invariant(vite, 'getVite() called before preloadVite()');
  return vite;
}
