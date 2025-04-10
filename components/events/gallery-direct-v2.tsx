"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Download, AlertCircle, ImageIcon } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { UploadPhotosDirect } from "./upload-photos-direct"
import { formatImageUrl } from "@/lib/image-utils"

interface GalleryDirectV2Props {
  eventId: string | number
}

interface EventPhoto {
  id: number
  photo_url: string
  uploaded_at: string
  caption?: string
}

export function GalleryDirectV2({ eventId }: GalleryDirectV2Props) {
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const fetchPhotos = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log(`[GalleryDirectV2] Fetching photos for event ${eventId}`)

      // Direct API call to get photos
      const response = await apiClient.get(`/events/${eventId}`)
      console.log("[GalleryDirectV2] Event response:", response.data)

      if (response.data && Array.isArray(response.data.photos)) {
        console.log("[GalleryDirectV2] Raw photos:", response.data.photos)

        // Filter and map photos to ensure they have valid URLs
        const validPhotos = response.data.photos
          .filter((photo: any) => photo && photo.photo_url)
          .map((photo: any) => {
            // Use the formatImageUrl utility to ensure proper URL formatting
            // This will handle the event ID prefix and proper URL construction
            const photoUrl = formatImageUrl(photo.photo_url);

            console.log(`[GalleryDirectV2] Processed photo URL: ${photoUrl}`);

            return {
              id: photo.id || Math.random(),
              photo_url: photoUrl,
              uploaded_at: photo.uploaded_at || new Date().toISOString()
            };
          })

        console.log("[GalleryDirectV2] Valid photos:", validPhotos)
        setPhotos(validPhotos)
      } else {
        console.log("[GalleryDirectV2] No photos found or invalid photos array")
        setPhotos([])
      }
    } catch (err) {
      console.error("[GalleryDirectV2] Error fetching photos:", err)
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (e) {
      return dateString
    }
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                  {/* Use a div with background image for better error handling */}
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url('/placeholder.svg')`,
                    }}
                  >
                    <img
                      src={photo.photo_url}
                      alt={`Foto acara ${photo.id}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      onLoad={(e) => {
                        console.log(`[GalleryDirectV2] Image loaded successfully: ${photo.photo_url}`)
                        // Update the parent div's background image on successful load
                        e.currentTarget.parentElement!.style.backgroundImage = `url('${photo.photo_url}')`
                      }}
                      onError={(e) => {
                        console.error(`[GalleryDirectV2] Error loading image: ${photo.photo_url}`)
                        // Hide the img element on error
                        e.currentTarget.style.display = 'none'
                      }}
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                    {formatDate(photo.uploaded_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada foto yang diunggah untuk acara ini.</p>
              <Button variant="outline" className="mt-4" onClick={handleUploadPhotos}>
                <Upload className="mr-2 h-4 w-4" />
                Unggah Foto Pertama
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadPhotosDirect
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
