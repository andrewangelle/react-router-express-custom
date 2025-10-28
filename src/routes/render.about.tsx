import { data, useLoaderData } from 'react-router';

export async function loader() {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const isServer = typeof document === 'undefined';
  const env = isServer ? 'server' : 'client';

  return data(
    { message: `About loader from ${env} loader` },
    {
      headers: { 'X-Custom': 'Hello' },
    },
  );
}

export default function About() {
  const data = useLoaderData<typeof loader>();
  return <h1>{data.message}</h1>;
}
