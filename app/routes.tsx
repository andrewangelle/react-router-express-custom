import { type RouteConfig, route } from '@react-router/dev/routes';

export default [
  route('/', './routes/_index.tsx'),
  route('/about', './routes/about.tsx'),
] satisfies RouteConfig;
