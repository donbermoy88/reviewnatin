import { Suspense } from 'react';
import AdminLoginPage from './login-client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-600">Loading…</div>}>
      <AdminLoginPage />
    </Suspense>
  );
}
