import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { data } from 'react-router';

export async function loader(loaderArgs: LoaderFunctionArgs) {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const isServer = typeof document === 'undefined';
  const env = isServer ? 'server' : 'client';

  switch (loaderArgs.request.method) {
    case 'GET':
    case 'OPTIONS':
      return data(
        {
          message: ` ${loaderArgs.request.method} handled on ${env} from loader`,
        },
        {
          headers: { 'X-Custom': 'Hello' },
        },
      );
  }
}

export async function action(loaderArgs: ActionFunctionArgs) {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const isServer = typeof document === 'undefined';
  const env = isServer ? 'server' : 'client';

  switch (loaderArgs.request.method) {
    case 'POST':
      return data(
        {
          message: ` ${loaderArgs.request.method} handled on ${env} from action`,
        },
        {
          headers: { 'X-Custom': 'Hello' },
        },
      );
    default:
      return data(
        { error: { message: 'Method Not Allowed' } },
        { status: 405, statusText: 'Method Not Allowed' },
      );
  }
}
