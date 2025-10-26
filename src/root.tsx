import {
  Form,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

export function Layout({ children }: { children: React.ReactNode }) {
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

        <Form method="post">
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
