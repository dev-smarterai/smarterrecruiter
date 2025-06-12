import { Navigation } from "@/components/ui/Navigation"
import { TranslationsProvider } from "@/components/openai-realtime/translations-context"

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <TranslationsProvider>
            <div>
                <Navigation showLogo={false} />
                <div className="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:px-6">{children}</div>
            </div>
        </TranslationsProvider>
    )
} 