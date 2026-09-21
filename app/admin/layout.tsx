import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminMobileNav } from '@/components/AdminMobileNav'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pt-[env(safe-area-inset-top)] md:pt-0">
      {children}
      <AdminMobileNav />
    </div>
  )
}
