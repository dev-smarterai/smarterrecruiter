import { useEffect, useRef, useState } from "react"

interface UseAutoScrollOptions {
  smooth?: boolean
  content?: React.ReactNode
  offset?: number
}

export function useAutoScroll({
  smooth = false,
  content,
  offset = 100,
}: UseAutoScrollOptions = {}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const scrollToBottom = (smoothScroll = smooth) => {
    if (!scrollRef.current) return

    const scrollEl = scrollRef.current
    const scrollOption = smoothScroll ? "smooth" : "auto"

    scrollEl.scrollTo({
      top: scrollEl.scrollHeight,
      behavior: scrollOption,
    })
  }

  const disableAutoScroll = () => {
    if (!scrollRef.current) return

    const scrollEl = scrollRef.current
    const scrollPosition = scrollEl.scrollTop + scrollEl.clientHeight
    const threshold = scrollEl.scrollHeight - offset

    if (scrollPosition < threshold) {
      setAutoScrollEnabled(false)
      setIsAtBottom(false)
    } else {
      setIsAtBottom(true)
    }
  }

  // Handle scroll event to check if at bottom
  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    const handleScroll = () => {
      const scrollPosition = scrollEl.scrollTop + scrollEl.clientHeight
      const atBottom = scrollPosition >= scrollEl.scrollHeight - offset
      setIsAtBottom(atBottom)
      
      if (atBottom) {
        setAutoScrollEnabled(true)
      }
    }

    scrollEl.addEventListener("scroll", handleScroll)
    return () => scrollEl.removeEventListener("scroll", handleScroll)
  }, [offset])

  // Auto-scroll when new content is added
  useEffect(() => {
    if (autoScrollEnabled) {
      scrollToBottom()
    }
  }, [content, autoScrollEnabled])

  return {
    scrollRef,
    isAtBottom,
    autoScrollEnabled,
    scrollToBottom,
    disableAutoScroll,
  }
} 