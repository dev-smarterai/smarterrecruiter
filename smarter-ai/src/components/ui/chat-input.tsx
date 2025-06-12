import { cn } from "@/lib/utils";
import React from "react";
import TextareaAutosize, { TextareaAutosizeProps } from "react-textarea-autosize";

interface ChatInputProps extends TextareaAutosizeProps { }

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
    ({ className, ...props }, ref) => {
        return (
            <TextareaAutosize
                ref={ref}
                className={cn(
                    "flex w-full rounded-md border-0 bg-transparent text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
        );
    }
);

ChatInput.displayName = "ChatInput";

export { ChatInput };
