"use client"

import { cx } from "@/lib/utils"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import * as React from "react"

interface RadioCardGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  className?: string
}

const RadioCardGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioCardGroupProps
>(({ className, ...props }, forwardedRef) => {
  return (
    <RadioGroupPrimitive.Root
      className={cx("grid gap-2", className)}
      {...props}
      ref={forwardedRef}
    />
  )
})
RadioCardGroup.displayName = "RadioCardGroup"

interface RadioCardItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  className?: string
}

const RadioCardItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioCardItemProps
>(({ className, children, ...props }, forwardedRef) => {
  return (
    <RadioGroupPrimitive.Item
      className={cx(
        "group relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 text-left shadow-sm transition-all dark:border-gray-800 dark:bg-gray-950",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900",
        "has-[:checked]:border-indigo-600 has-[:checked]:dark:border-indigo-400",
        "aria-checked:border-indigo-600 aria-checked:dark:border-indigo-400",
        "data-[state=checked]:border-indigo-600 data-[state=checked]:dark:border-indigo-400",
        className,
      )}
      {...props}
      ref={forwardedRef}
    >
      {children}
    </RadioGroupPrimitive.Item>
  )
})
RadioCardItem.displayName = "RadioCardItem"

const RadioCardIndicator = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, forwardedRef) => {
  return (
    <span
      ref={forwardedRef}
      className={cx(
        "flex size-5 items-center justify-center rounded-full border-2 border-gray-300 group-data-[state=checked]:border-indigo-600 dark:border-gray-600 group-data-[state=checked]:dark:border-indigo-400",
        className,
      )}
      {...props}
    >
      <span className="size-2.5 rounded-full bg-indigo-600 opacity-0 group-data-[state=checked]:opacity-100 dark:bg-indigo-400" />
    </span>
  )
})
RadioCardIndicator.displayName = "RadioCardIndicator"

export { RadioCardGroup, RadioCardItem, RadioCardIndicator } 