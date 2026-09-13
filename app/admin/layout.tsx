import type { ReactNode } from 'react'
import { AdminMobileNav } from '@/components/AdminMobileNav'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pt-[env(safe-area-inset-top)] md:pt-0">
      {children}
      <AdminMobileNav />
    </div>
  )
}
