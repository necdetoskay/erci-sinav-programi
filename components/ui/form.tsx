"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const FormRoot = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

// Adım 1: Yeni Context Tanımla
type FormFieldStateContextValue = {
  id: string;
  name: string;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  error?: FieldError; // react-hook-form'dan FieldError tipini import etmemiz gerekebilir, şimdilik any varsayalım
};

const FormFieldStateContext = React.createContext<FormFieldStateContextValue | null>(null);


// Adım 2: FormField'ı Güncelle
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  // useContext'i render prop'unun dışına taşı
  const itemContext = React.useContext(FormItemContext);
  if (!itemContext) {
    // FormItem içinde değilse veya context sağlanmadıysa hata ver
    // Bu durum normalde olmamalı ama bir güvenlik önlemi
    throw new Error("FormField must be used within a FormItem");
  }
  const id = itemContext.id;

  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller
        {...props}
        render={({ field, fieldState, formState }) => {
          // id'yi dışarıdan al, burada useContext kullanma
          // if (!itemContext) { // Bu kontrol artık yukarıda yapıldı
          //    // FormItem içinde değilse veya context sağlanmadıysa hata ver
          //    // Bu durum normalde olmamalı ama bir güvenlik önlemi
          // }
          // const id = itemContext.id; // id artık dışarıdan geliyor
          const contextValue: FormFieldStateContextValue = {
            id, // Dışarıdan alınan id'yi kullan
            name: props.name,
            formItemId: `${id}-form-item`,
            formDescriptionId: `${id}-form-item-description`,
            formMessageId: `${id}-form-item-message`,
            error: fieldState.error, // fieldState'ten hatayı al
          };
          // Controller'ın render prop'u bir React elementi döndürmeli
          // Orijinal props.render'ı çağırırken field, fieldState, formState geç
          // ve yeni context'i sağla
          const renderResult = props.render({ field, fieldState, formState });
          return (
            <FormFieldStateContext.Provider value={contextValue}>
              {renderResult}
            </FormFieldStateContext.Provider>
          );
        }}
      />
    </FormFieldContext.Provider>
  );
};


// Adım 3: useFormField'ı Güncelle
const useFormField = () => {
  // const fieldContext = React.useContext(FormFieldContext) // Artık gerekli değil
  // const itemContext = React.useContext(FormItemContext) // Artık gerekli değil, id FormFieldStateContext'ten geliyor
  const fieldStateContext = React.useContext(FormFieldStateContext);

  if (!fieldStateContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  // Gerekli değerleri yeni context'ten al
  return fieldStateContext;
};

// FieldError tipini react-hook-form'dan import etmeyi unutma
import { FieldError } from "react-hook-form";

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

type FormProps<T extends z.ZodType<any, any>> = {
  form: UseFormReturn<z.infer<T>>;
  children: React.ReactNode;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, "children">

// Bu bileşen artık gerçek <form> etiketini render ediyor
// ve onSubmit gibi props'ları doğru şekilde iletiyor.
function FormComponent<T extends z.ZodType<any, any>>({
  form,
  children,
  onSubmit, // onSubmit prop'unu ekle
  className, // className prop'unu ekle
  ...props // Diğer HTML form özellikleri
}: FormProps<T> & { onSubmit?: React.FormEventHandler<HTMLFormElement>, className?: string }) { // onSubmit ve className tiplerini ekle
  return (
    <FormRoot {...form}>
      {/* Form etiketini burada render et ve props'ları ilet */}
      <form onSubmit={onSubmit} className={className} {...props}>
        {children}
      </form>
    </FormRoot>
  );
}

export {
  useFormField,
  FormRoot,
  FormComponent as Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
