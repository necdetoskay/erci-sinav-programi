'use client';

import Link from 'next/link';
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { Suspense } from 'react';

function NotFoundContent() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link href="/">
        Go back to Home
      </Link>
    </div>
  );
}

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
