import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import { BACKEND_URL } from '../lib/api';

export default function Home({ posts, error }) {
  return (
    <>
      <Head>
        <title>Simple Blog</title>
      </Head>
      <Header />
      <main className="container">
        {error && <div className="error-banner">{error}</div>}

        {!error && posts.length === 0 && (
          <p className="empty-state">
            No posts yet. <Link href="/posts/new">Write the first one</Link>.
          </p>
        )}

        {posts.map((post) => (
          <article className="post-card" key={post.id}>
            <h2>
              <Link href={`/posts/${post.id}`}>{post.title}</Link>
            </h2>
            <p className="post-date">
              {new Date(post.created_at).toDateString()}
            </p>
            <p className="post-excerpt">
              {post.content.substring(0, 150)}
              {post.content.length > 150 ? '...' : ''}
            </p>
          </article>
        ))}
      </main>
    </>
  );
}

export async function getServerSideProps() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/posts`);
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    const posts = await res.json();
    return { props: { posts } };
  } catch (err) {
    return { props: { posts: [], error: 'Could not load posts right now.' } };
  }
}
