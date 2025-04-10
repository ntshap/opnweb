"use client"

import { useState, useEffect } from "react"
import { AlertCircle, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Define event handlers
    const handleOnline = () => {
      setIsOnline(true)
      // Show a temporary alert when connection is restored
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 5000) // Hide after 5 seconds
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowAlert(true) // Keep showing when offline
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showAlert) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {isOnline ? (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Koneksi Dipulihkan</AlertTitle>
          <AlertDescription className="text-green-700">
            Koneksi internet Anda telah dipulihkan. Anda dapat melanjutkan aktivitas.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Tidak Ada Koneksi Internet</AlertTitle>
          <AlertDescription>
            Anda sedang offline. Beberapa fitur mungkin tidak berfungsi dengan baik.
            Silakan periksa koneksi internet Anda.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
