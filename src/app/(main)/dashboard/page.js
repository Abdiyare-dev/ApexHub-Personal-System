'use client'

export default function Dashboard({ user }) {
  // Placeholder user name if context isn't hooked up yet
  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome to ApexHub, {username}</h1>
        <p className="text-slate-500 mt-1">Here is an overview of your personal system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-lg text-slate-700 mb-2">Finance</h2>
          <p className="text-slate-500 text-sm">Finance module placeholder.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-lg text-slate-700 mb-2">Tasks & Projects</h2>
          <p className="text-slate-500 text-sm">Productivity module placeholder.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-lg text-slate-700 mb-2">Habits</h2>
          <p className="text-slate-500 text-sm">Habits tracking placeholder.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-lg text-slate-700 mb-2">Goals & Milestones</h2>
          <p className="text-slate-500 text-sm">Goals tracking placeholder.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-lg text-slate-700 mb-2">Timetable</h2>
          <p className="text-slate-500 text-sm">Schedule placeholder.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-lg text-slate-700 mb-2">Journal & Planner</h2>
          <p className="text-slate-500 text-sm">Journaling placeholder.</p>
        </div>
      </div>
    </div>
  )
}
