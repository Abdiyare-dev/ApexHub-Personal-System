import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import InstallPrompt from '@/components/layout/InstallPrompt'
import LandingPage from '@/components/Landing/LandingPage'

export default async function MainLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // '/' is the one route in this group that stays public: show the
    // marketing landing page instead of the app chrome. Every other route
    // here (finance, habits, timetable, ...) still requires a session.
    const pathname = (await headers()).get('x-pathname') || ''
    if (pathname === '/') {
      return <LandingPage />
    }
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
