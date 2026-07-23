// Used only in server-side code (getServerSideProps and API routes) —
// never shipped to the browser. Inside Docker Compose this resolves to
// the backend container via its service name; for local `next dev`
// without Docker, it falls back to localhost.
export const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000';
