import { useRef, useMemo, useEffect } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Upload, X } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface FormFieldConfig {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'textarea' | 'signature' | 'file' | 'heading'
  placeholder?: string
  required?: boolean
  options?: string[]
  conditional?: {
    fieldId: string
    value: any
  }
}

export interface FormTemplate {
  title: string
  description?: string
  fields: FormFieldConfig[]
}

interface DynamicFormRendererProps {
  template: FormTemplate
  onSubmit: (values: Record<string, any>) => void
  isSubmitting?: boolean
}

export function DynamicFormRenderer({ template, onSubmit, isSubmitting }: DynamicFormRendererProps) {
  const signaturePads = useRef<Record<string, SignatureCanvas | null>>({})

  // Build Zod schema dynamically from field definitions
  const formSchema = useMemo(() => {
    const shape: any = {}
    template.fields.forEach((field) => {
      if (field.type === 'heading') return
      let fieldSchema: any = z.any()
      if (['text', 'select', 'date', 'signature', 'textarea'].includes(field.type)) {
        fieldSchema = z.string()
      } else if (field.type === 'number') {
        fieldSchema = z.coerce.number()
      } else if (field.type === 'checkbox') {
        fieldSchema = z.boolean().default(false)
      } else if (field.type === 'file') {
        fieldSchema = z.any()
      }
      shape[field.id] = fieldSchema.optional().or(z.literal(''))
    })

    return z.object(shape).superRefine((data, ctx) => {
      template.fields.forEach((field) => {
        if (field.type === 'heading' || !field.required) return
        let visible = true
        if (field.conditional) {
          visible = data[field.conditional.fieldId] === field.conditional.value
        }
        if (visible) {
          const val = data[field.id]
          if (val === undefined || val === null || val === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${field.label} is required`,
              path: [field.id],
            })
          }
        }
      })
    })
  }, [template.fields])

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: template.fields.reduce((acc, field) => {
      if (field.type !== 'heading') {
        acc[field.id] = field.type === 'checkbox' ? false : field.type === 'number' ? 0 : ''
      }
      return acc
    }, {} as any),
  })

  useEffect(() => {
    const defaultValues = template.fields.reduce((acc, field) => {
      if (field.type !== 'heading') {
        acc[field.id] = field.type === 'checkbox' ? false : field.type === 'number' ? 0 : ''
      }
      return acc
    }, {} as any)
    form.reset(defaultValues)
  }, [template.fields, form])

  const watchedValues = useWatch({ control: form.control })

  const isVisible = (field: FormFieldConfig) => {
    if (!field.conditional) return true
    return watchedValues[field.conditional.fieldId] === field.conditional.value
  }

  const handleSignatureEnd = (id: string) => {
    const canvas = signaturePads.current[id]
    if (canvas) form.setValue(id, canvas.toDataURL(), { shouldValidate: true })
  }

  const clearSignature = (id: string) => {
    const canvas = signaturePads.current[id]
    if (canvas) {
      canvas.clear()
      form.setValue(id, '', { shouldValidate: true })
    }
  }

  const handleSubmit = (values: any) => {
    // Filter out hidden conditional fields before submission
    const filteredValues = { ...values }
    template.fields.forEach((field) => {
      if (field.type !== 'heading' && !isVisible(field)) {
        delete filteredValues[field.id]
      }
    })
    onSubmit(filteredValues)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
      {template.fields.map((field) => {
        if (!isVisible(field)) return null

        // Section heading
        if (field.type === 'heading') {
          return (
            <div key={field.id} className="pt-4 pb-1">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{field.label}</h3>
              <Separator className="mt-2" />
            </div>
          )
        }

        const error = form.formState.errors[field.id]

        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-semibold text-slate-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>

            {field.type === 'text' && (
              <Input
                id={field.id}
                placeholder={field.placeholder}
                {...form.register(field.id)}
                className={cn(error && 'border-red-400')}
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                {...form.register(field.id)}
                className={cn('min-h-[80px]', error && 'border-red-400')}
              />
            )}

            {field.type === 'number' && (
              <Input
                id={field.id}
                type="number"
                placeholder={field.placeholder}
                {...form.register(field.id)}
                className={cn(error && 'border-red-400')}
              />
            )}

            {field.type === 'date' && (
              <Input
                id={field.id}
                type="date"
                {...form.register(field.id)}
                className={cn(error && 'border-red-400')}
              />
            )}

            {field.type === 'select' && (
              <Controller
                control={form.control}
                name={field.id}
                render={({ field: f }) => (
                  <Select onValueChange={f.onChange} value={f.value || ''}>
                    <SelectTrigger className={cn(error && 'border-red-400')}>
                      <SelectValue placeholder={field.placeholder || 'Select an option'} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}

            {field.type === 'checkbox' && (
              <div className="flex items-center gap-2">
                <input
                  id={field.id}
                  type="checkbox"
                  {...form.register(field.id)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">{field.placeholder || field.label}</span>
              </div>
            )}

            {field.type === 'signature' && (
              <Controller
                control={form.control}
                name={field.id}
                render={({ field: f }) => (
                  <div className="space-y-1">
                    <div className="border rounded-md bg-white overflow-hidden h-[140px] relative">
                      <SignatureCanvas
                        ref={(ref) => { signaturePads.current[field.id] = ref }}
                        penColor="black"
                        canvasProps={{ style: { width: '100%', height: '100%' } }}
                        onEnd={() => handleSignatureEnd(field.id)}
                      />
                      {f.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:text-red-500"
                          onClick={() => clearSignature(field.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">Sign above using your mouse or touchscreen.</p>
                  </div>
                )}
              />
            )}

            {field.type === 'file' && (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-slate-400" />
                <Input
                  id={field.id}
                  type="file"
                  className="cursor-pointer"
                  onChange={(e) => form.setValue(field.id, e.target.files?.[0])}
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500">{error.message as string}</p>
            )}
          </div>
        )
      })}

      <div className="pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Request'}
        </Button>
      </div>
    </form>
  )
}
