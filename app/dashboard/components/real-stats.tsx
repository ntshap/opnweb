"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, FileText } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import axios from "axios"

export function RealStats() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalPhotos: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        
        // Get token from localStorage
        const token = localStorage.getItem('token')
        
        // Fetch events from the backend API
        const response = await axios.get('https://backend-project-pemuda.onrender.com/api/v1/events', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            limit: 100 // Get a large number to calculate accurate stats
          }
        })
        
        const events = response.data
        
        // Calculate stats from real data
        const totalEvents = events.length
        const activeEvents = events.filter(e => e.status === "akan datang").length
        const totalPhotos = events.reduce((acc, e) => acc + (e.photos?.length || 0), 0)
        
        setStats({
          totalEvents,
          activeEvents,
          totalPhotos
        })
        
        console.log('Fetched real stats:', { totalEvents, activeEvents, totalPhotos })
      } catch (error) {
        console.error('Error fetching stats:', error)
        // Keep the default values in case of error
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStats()
  }, [])

  return (
    <>
      <StatCard
        title="Total Acara"
        value={stats.totalEvents.toString()}
        description="Total acara"
        trend="up"
        percentage={0}
        icon={Calendar}
        isLoading={isLoading}
      />
      <StatCard
        title="Acara Aktif"
        value={stats.activeEvents.toString()}
        description="Acara mendatang"
        trend="up"
        percentage={0}
        icon={Users}
        isLoading={isLoading}
      />
      <StatCard
        title="Total Foto"
        value={stats.totalPhotos.toString()}
        description="Foto acara"
        trend="up"
        percentage={0}
        icon={FileText}
        isLoading={isLoading}
      />
    </>
  )
}
