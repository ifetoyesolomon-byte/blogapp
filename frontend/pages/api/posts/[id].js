import { BACKEND_URL } from '../../../lib/api';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/posts/${id}`, {
      method: 'DELETE',
    });
    if (backendRes.status === 204) return res.status(204).end();
    const data = await backendRes.json().catch(() => ({}));
    res.status(backendRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Could not reach backend service.' });
  }
}
