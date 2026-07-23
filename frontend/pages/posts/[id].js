import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/Header';
import { BACKEND_URL } from '../../lib/api';

export default function PostPage({ post, notFound }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (notFound) {
    return (
      <>
        <Header />
        <main className="container">
          <p>Post not found.</p>
        </main>
      </>
    );
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post.');
      router.push('/');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <>
      <Head>
        <title>{post.title}</title>
      </Head>
      <Header />
      <main className="container">
        {error && <div className="error-banner">{error}</div>}
        <article className="post-full">
          <h1>{post.title}</h1>
          <p className="post-date">
            {new Date(post.created_at).toDateString()}
          </p>
          <p className="post-body">{post.content}</p>
        </article>

        <button className="delete-btn" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
        <br />
        <a href="/">&larr; Back to all posts</a>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/posts/${params.id}`);
    if (res.status === 404) return { props: { notFound: true } };
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    const post = await res.json();
    return { props: { post } };
  } catch (err) {
    return { props: { notFound: true } };
  }
}
