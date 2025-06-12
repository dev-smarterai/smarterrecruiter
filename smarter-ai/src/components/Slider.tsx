"use client"

import { cx } from "@/lib/utils"
import * as SliderPrimitive from "@radix-ui/react-slider"
import * as React from "react"

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  className?: string
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, ...props }, forwardedRef) => (
  <SliderPrimitive.Root
    ref={forwardedRef}
    className={cx(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
      <SliderPrimitive.Range className="absolute h-full bg-indigo-600 dark:bg-indigo-400" />
    </SliderPrimitive.Track>
    {props.value?.map((_: any, i: number) => (
      <SliderPrimitive.Thumb
        key={i}
        className="block size-4 rounded-full border border-indigo-600 bg-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-indigo-400 dark:bg-gray-950 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
      />
    ))}
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider } 