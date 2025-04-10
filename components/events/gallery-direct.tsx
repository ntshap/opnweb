"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Download, AlertCircle } from "lucide-react"
import Image from "next/image"
import { apiClient } from "@/lib/api-client"
import { UploadPhotosModal } from "./upload-photos-modal"

interface GalleryDirectProps {
  eventId: string | number
}

interface EventPhoto {
  id: number
  photo_url: string
  uploaded_at: string
  caption?: string
}

export function GalleryDirect({ eventId }: GalleryDirectProps) {
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const fetchPhotos = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log(`Fetching photos for event ${eventId}`)

      // Get the event details to access photos
      const response = await apiClient.get(`/events/${eventId}`)
      console.log("Event response:", response.data)

      if (response.data && response.data.photos) {
        // Make sure we have valid photo objects
        const validPhotos = response.data.photos
          .filter(photo => photo && photo.photo_url) // Filter out invalid photos
          .map(photo => ({
            ...photo,
            // Ensure photo_url is a string
            photo_url: typeof photo.photo_url === 'string' ? photo.photo_url : '',
            // Ensure uploaded_at is a valid date string
            uploaded_at: photo.uploaded_at || new Date().toISOString()
          }))

        console.log("Valid photos:", validPhotos)
        setPhotos(validPhotos)
      } else {
        setPhotos([])
      }
    } catch (err) {
      console.error("Error fetching photos:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [eventId])

  const handleUploadPhotos = () => {
    setIsUploadModalOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Foto Acara</CardTitle>
          <Button variant="outline" size="sm" onClick={handleUploadPhotos}>
            <Upload className="mr-2 h-4 w-4" />
            Unggah Foto
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40 text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                  {/* Use img tag instead of Image component for better error handling */}
                  <img
                    src={photo.photo_url}
                    alt={`Foto acara ${photo.id}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Error loading image: ${photo.photo_url}`)
                      e.currentTarget.src = "/placeholder.svg"
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                    {photo.caption || `Foto ${photo.id}`}
                    <div className="text-xs opacity-75">
                      {new Date(photo.uploaded_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Belum ada foto yang diunggah untuk acara ini.</p>
              <Button variant="outline" className="mt-4" onClick={handleUploadPhotos}>
                <Upload className="mr-2 h-4 w-4" />
                Unggah Foto Pertama
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadPhotosModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        eventId={eventId}
        onSuccess={() => {
          // Refetch photos after successful upload
          fetchPhotos()
        }}
      />
    </>
  )
}
