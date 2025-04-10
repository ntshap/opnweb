"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Edit, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { TipTapEditor, TipTapContent } from "@/components/ui/tiptap-editor"

interface NotulensiEditorSimpleProps {
  eventId: string | number
  initialContent: string
  onSaved?: () => void
}

export function NotulensiEditorSimple({ eventId, initialContent, onSaved }: NotulensiEditorSimpleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(initialContent || "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Update content when initialContent changes
  useEffect(() => {
    setContent(initialContent || "")
  }, [initialContent])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      console.log(`[NotulensiEditorSimple] Saving notulensi for event ${eventId}:`, content)

      // Get token from localStorage
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.")
      }

      // Make a direct API call using fetch instead of axios or apiClient
      const response = await fetch(
        `https://backend-project-pemuda.onrender.com/api/v1/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ minutes: content })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`[NotulensiEditorSimple] Save response:`, data)

      toast({
        title: "Berhasil",
        description: "Notulensi berhasil disimpan",
      })

      setIsEditing(false)

      if (onSaved) {
        onSaved()
      }
    } catch (err) {
      console.error("[NotulensiEditorSimple] Error saving notulensi:", err)

      let errorMessage = "Gagal menyimpan notulensi. Silakan coba lagi."

      if (err instanceof Error) {
        console.error("[NotulensiEditorSimple] Error:", err.message)
        errorMessage = err.message
      }

      setError(errorMessage)

      toast({
        title: "Gagal",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // View mode - show existing content with edit button or prompt to add notes
  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Notulensi</CardTitle>
          {initialContent && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Notulensi
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {initialContent ? (
            <TipTapContent content={initialContent} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada notulensi untuk acara ini</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Tambah Notulensi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Edit mode - show editor with save button
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialContent ? "Edit Notulensi" : "Tambah Notulensi"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TipTapEditor
          content={content}
          onChange={setContent}
          placeholder="Masukkan notulensi rapat atau catatan penting dari acara ini"
        />

        {error && (
          <div className="mt-2 p-2 bg-red-50 text-red-800 rounded-md flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {initialContent && (
          <Button variant="outline" onClick={() => {
            setContent(initialContent)
            setIsEditing(false)
            setError(null)
          }}>
            Batal
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Notulensi
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
