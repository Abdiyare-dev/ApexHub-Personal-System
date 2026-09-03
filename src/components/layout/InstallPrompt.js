'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      
      // Check if user already dismissed it
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (dismissed !== 'true') {
        // Stash the event so it can be triggered later.
        setDeferredPrompt(e)
        // Update UI notify the user they can install the PWA
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    // Show the install prompt
    deferredPrompt.prompt()
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-[4.5rem] md:bottom-[unset] md:top-16 left-0 right-0 z-40 bg-emerald-600 text-white p-3 flex items-center justify-between shadow-lg">
      <div className="text-sm font-medium px-4">
        Install ApexHub for quick access
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstallClick}
          className="bg-white text-emerald-700 px-3 py-1 rounded text-sm font-bold shadow hover:bg-emerald-50 transition-colors"
        >
          Install
        </button>
        <button 
          onClick={handleDismiss}
          className="p-1 hover:bg-emerald-500 rounded text-emerald-100 transition-colors"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
