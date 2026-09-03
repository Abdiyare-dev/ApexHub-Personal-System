import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import InstallPrompt from '@/components/layout/InstallPrompt'

export default async function MainLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <Sidebar />
      <div className="main-wrapper" id="mainWrapper">
        <TopNav />
        <InstallPrompt />
        <main className="main-content" id="mainContent">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  )
}
