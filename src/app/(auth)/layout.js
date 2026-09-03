export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-8">
          <span className="text-2xl font-bold text-slate-800 tracking-tight">ApexHub</span>
        </div>
        {children}
      </div>
    </div>
  )
}
