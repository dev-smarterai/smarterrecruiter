"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import * as React from "react";

interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "sent" | "received";
}

export const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
    ({ className, variant = "received", children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "flex w-full items-start gap-2 p-4",
                    variant === "sent" && "flex-row-reverse",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

ChatBubble.displayName = "ChatBubble";

interface ChatBubbleAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string;
    fallback: string;
    videoSrc?: string;
}

export const ChatBubbleAvatar = React.forwardRef<
    HTMLDivElement,
    ChatBubbleAvatarProps
>(({ className, src, videoSrc, fallback, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted",
                className
            )}
            {...props}
        >
            {videoSrc ? (
                <video autoPlay loop muted playsInline className="w-full h-full object-cover rounded-full">
                    <source src={videoSrc} type="video/mp4" />
                </video>
            ) : src ? (
                <Image
                    src={src}
                    width={40}
                    height={40}
                    alt="Avatar"
                    className="rounded-full object-cover"
                />
            ) : (
                <span className="text-sm font-medium">{fallback}</span>
            )}
        </div>
    );
});

ChatBubbleAvatar.displayName = "ChatBubbleAvatar";

interface ChatBubbleMessageProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "sent" | "received";
    isLoading?: boolean;
}

export const ChatBubbleMessage = React.forwardRef<
    HTMLDivElement,
    ChatBubbleMessageProps
>(({ className, variant = "received", isLoading, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "rounded-lg p-3",
                variant === "sent"
                    ? "ml-auto bg-white text-gray-900 border border-gray-200 shadow-sm"
                    : "bg-muted",
                className
            )}
            {...props}
        >
            {isLoading ? (
                <div className="flex items-center space-x-1">
                    <div className="animate-bounce h-1.5 w-1.5 rounded-full bg-current"></div>
                    <div
                        className="animate-bounce h-1.5 w-1.5 rounded-full bg-current"
                        style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                        className="animate-bounce h-1.5 w-1.5 rounded-full bg-current"
                        style={{ animationDelay: "300ms" }}
                    ></div>
                </div>
            ) : (
                children
            )}
        </div>
    );
});

ChatBubbleMessage.displayName = "ChatBubbleMessage";
