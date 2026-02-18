'use client';

import DashboardLayout from '@/components/layout/Layout';

export default function ProtectedLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
