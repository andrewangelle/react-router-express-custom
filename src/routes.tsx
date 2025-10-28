import { prefix, type RouteConfig } from '@react-router/dev/routes';
import { flatRoutes } from '@react-router/fs-routes';

const routes = (await flatRoutes()) satisfies RouteConfig;
export default [...prefix('/api/service', routes)] satisfies RouteConfig;
