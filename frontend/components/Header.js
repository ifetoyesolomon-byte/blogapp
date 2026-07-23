import Link from 'next/link';

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="site-title">Simple Blog</Link>
      <Link href="/posts/new" className="new-post-btn">+ New Post</Link>
    </header>
  );
}
