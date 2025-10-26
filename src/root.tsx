import {
  Form,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetcher,
  useLoaderData,
} from 'react-router';
import type { Route } from './+types/root';

const db = { message: 'Hello world!' };

export async function loader(_loaderArgs: Route.LoaderArgs) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return { message: db.message };
}

export async function clientAction({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  db.message = String(formData.get('message'));
  return { message: db.message };
}

export function Layout({
  children,
}: Route.ComponentProps & { children: React.ReactNode }) {
  const { message } = useLoaderData<typeof loader>();
  const { Form, data = { message } } = useFetcher();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <h1>React Router Custom Framework</h1>
        <Form method="post" action="/">
          <p>
            Message: <i>{data.message}</i>
          </p>
          <fieldset>
            <input name="message" placeholder="Enter a new message" />{' '}
            <button type="submit">Update</button>
          </fieldset>
        </Form>

        <p>
          <Link to="/">Home</Link> | <Link to="/about">About</Link>
        </p>

        <hr />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
