import path from 'pathe';

export function isReactRouterRepo() {
  // We use '@react-router/node' for this check since it's a
  // dependency of this package and guaranteed to be in node_modules
  const serverRuntimePath = path.dirname(
    require.resolve('@react-router/node/package.json'),
  );
  const serverRuntimeParentDir = path.basename(
    path.resolve(serverRuntimePath, '..'),
  );
  return serverRuntimeParentDir === 'packages';
}
