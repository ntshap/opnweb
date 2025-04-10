"use client"

import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { eventApi } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface Event {
  id: number
  title: string
  date: string
}

export function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        // Fetch events from the backend API with explicit API URL
        const response = await fetch('https://backend-project-pemuda.onrender.com/api/v1/events?page=1&limit=10', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('Fetched events from backend:', data)

        // Sort events by date (newest first)
        const sortedEvents = data.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })

        // Filter to only include upcoming events
        const upcomingEvents = sortedEvents.filter(event =>
          event.status === "akan datang"
        )

        setEvents(upcomingEvents)
        setError(null)
      } catch (err) {
        console.error("Error fetching events:", err)
        setError("Gagal memuat data acara dari server")
        toast({
          title: "Error",
          description: "Gagal memuat data acara. Silakan coba lagi nanti.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [toast])

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Acara Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Tidak ada acara yang akan datang</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 font-medium text-gray-500 pb-2">
              <div>Nama Acara</div>
              <div className="text-right">Tanggal</div>
            </div>
            {events.map((event) => (
              <div key={event.id} className="grid grid-cols-2 border-b pb-4">
                <div className="font-medium">{event.title}</div>
                <div className="text-right">{format(parseISO(event.date), "dd MMM yyyy", { locale: id })}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
