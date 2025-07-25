"use client";

import { cx } from "@/lib/utils";
import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TextShimmer } from "./text-shimmer";

interface AIVoiceInputProps {
    onStart?: () => void;
    onStop?: (duration: number) => void;
    visualizerBars?: number;
    demoMode?: boolean;
    demoInterval?: number;
    className?: string;
}

export function AIVoiceInput({
    onStart,
    onStop,
    visualizerBars = 48,
    demoMode = false,
    demoInterval = 3000,
    className
}: AIVoiceInputProps) {
    const [submitted, setSubmitted] = useState(false);
    const [time, setTime] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [isDemo, setIsDemo] = useState(demoMode);
    const initializedRef = useRef(false);

    // Only run once on client-side mount
    useEffect(() => {
        setIsClient(true);
        initializedRef.current = true;
    }, []);

    // Handle demoMode initial setup only once
    useEffect(() => {
        if (!initializedRef.current) return;
        setIsDemo(demoMode);
    }, [demoMode]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (submitted) {
            onStart?.();
            intervalId = setInterval(() => {
                setTime((t) => t + 1);
            }, 1000);
        } else if (time > 0) {
            // Only call onStop when there's been some time recorded
            onStop?.(time);
            setTime(0);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [submitted, time, onStart, onStop]);

    useEffect(() => {
        if (!isDemo) return;

        let timeoutId: NodeJS.Timeout;
        const runAnimation = () => {
            setSubmitted(true);
            timeoutId = setTimeout(() => {
                setSubmitted(false);
                timeoutId = setTimeout(runAnimation, 1000);
            }, demoInterval);
        };

        const initialTimeout = setTimeout(runAnimation, 100);
        return () => {
            clearTimeout(timeoutId);
            clearTimeout(initialTimeout);
        };
    }, [isDemo, demoInterval]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleClick = () => {
        if (isDemo) {
            setIsDemo(false);
            setSubmitted(false);
        } else {
            setSubmitted((prev) => !prev);
        }
    };

    return (
        <div className={cx("w-full py-4", className)}>
            <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
                <button
                    className={cx(
                        "group w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
                        submitted
                            ? "bg-none"
                            : "bg-none hover:bg-black/10 dark:hover:bg-white/10"
                    )}
                    type="button"
                    onClick={handleClick}
                >
                    {submitted ? (
                        <div
                            className="w-6 h-6 rounded-sm animate-spin bg-black dark:bg-white cursor-pointer pointer-events-auto"
                            style={{ animationDuration: "3s" }}
                        />
                    ) : (
                        <Mic className="w-6 h-6 text-black/70 dark:text-white/70" />
                    )}
                </button>

                <span
                    className={cx(
                        "font-mono text-sm transition-opacity duration-300",
                        submitted
                            ? "text-black/70 dark:text-white/70"
                            : "text-black/30 dark:text-white/30"
                    )}
                >
                    {formatTime(time)}
                </span>

                <div className="h-4 w-64 flex items-center justify-center gap-0.5">
                    {[...Array(visualizerBars)].map((_, i) => (
                        <div
                            key={i}
                            className={cx(
                                "w-0.5 rounded-full transition-all duration-300",
                                submitted
                                    ? "bg-black/50 dark:bg-white/50 animate-pulse"
                                    : "bg-black/10 dark:bg-white/10 h-1"
                            )}
                            style={
                                submitted && isClient
                                    ? {
                                        height: `${20 + Math.random() * 80}%`,
                                        animationDelay: `${i * 0.05}s`,
                                    }
                                    : undefined
                            }
                        />
                    ))}
                </div>

                {submitted ? (
                    <p className="h-4 text-xs text-black/70 dark:text-white/70">
                        Listening...
                    </p>
                ) : (
                    <TextShimmer
                        className="h-4 text-xs font-medium"
                        duration={3}
                    >
                        Click to begin interview
                    </TextShimmer>
                )}
            </div>
        </div>
    );
} 