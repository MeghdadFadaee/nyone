import * as LabelPrimitive from "@radix-ui/react-label"
import * as React from "react"

import { useTranslatedChildren } from "@/lib/translations"
import { cn } from "@/lib/utils"

function Label({
  className,
  children,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const translatedChildren = useTranslatedChildren(children)

  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {translatedChildren}
    </LabelPrimitive.Root>
  )
}

export { Label }
