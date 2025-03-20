'use client';

import dynamic from 'next/dynamic';

const FaceDistortion = dynamic(
  () => import('./FaceDistortion'),
  { ssr: false }
);

export default function ClientWrapper() {
  return <FaceDistortion />;
}