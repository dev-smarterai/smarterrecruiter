"use client"

import { cx } from "@/lib/utils"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import * as React from "react"

interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  className?: string
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, ...props }, forwardedRef) => {
  return (
    <RadioGroupPrimitive.Root
      className={cx("grid gap-2", className)}
      {...props}
      ref={forwardedRef}
    />
  )
})
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  className?: string
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, ...props }, forwardedRef) => {
  return (
    <RadioGroupPrimitive.Item
      className={cx(
        "size-4 rounded-full border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-950",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900",
        "data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600 dark:data-[state=checked]:border-indigo-400 dark:data-[state=checked]:bg-indigo-400",
        className,
      )}
      {...props}
      ref={forwardedRef}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="size-1.5 rounded-full bg-white" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem } 