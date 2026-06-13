import { Redirect } from 'expo-router';

/** Legacy removed route: keep old deep links from landing on an unmatched route. */
export default function RemovedTutorRoute() {
  return <Redirect href="/subscribe" />;
}
