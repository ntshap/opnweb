import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar as CalendarIcon, FileText, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { MeetingMinutesFormData } from "@/lib/api"
import { TipTapEditor } from "@/components/ui/tiptap-editor"

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Judul harus diisi"),
  description: z.string().min(1, "Deskripsi harus diisi"),
  date: z.date({
    required_error: "Tanggal harus diisi",
  }),
  document_url: z.string().url("URL dokumen tidak valid").optional().or(z.literal('')),
  event_id: z.number(),
})

interface MeetingMinutesFormProps {
  defaultValues?: Partial<MeetingMinutesFormData & { date: Date }>
  eventId: number
  onSubmit: (data: z.infer<typeof formSchema>) => void
  isSubmitting?: boolean
}

export function MeetingMinutesForm({ defaultValues, eventId, onSubmit, isSubmitting = false }: MeetingMinutesFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "", // Provide empty string as default
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      document_url: defaultValues?.document_url || "",
      event_id: eventId,
    },
  })

  function handleSubmit(values: z.infer<typeof formSchema>) {
    // Ensure the description is a string
    const formattedValues = {
      ...values,
      description: values.description || '',
      document_url: values.document_url || undefined
    };

    console.log('Submitting meeting minutes form with values:', formattedValues);
    onSubmit(formattedValues);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan judul notulensi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <div className="border rounded-md">
                  <TipTapEditor
                    content={field.value || ''}
                    onChange={(html) => {
                      field.onChange(html);
                      console.log('TipTap content updated:', html);
                    }}
                    placeholder="Masukkan deskripsi notulensi"
                    className="min-h-32"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: id })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="document_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Dokumen (Opsional)</FormLabel>
              <FormControl>
                <div className="flex">
                  <Input
                    placeholder="Masukkan URL dokumen (Google Docs, PDF, dll)"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Masukkan URL dokumen notulensi jika ada (misalnya Google Docs, PDF, atau dokumen lainnya)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="event_id"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input type="hidden" {...field} value={eventId} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Notulensi"
          )}
        </Button>
      </form>
    </Form>
  )
}
