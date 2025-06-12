"use client"
import { Card } from "@/components/Card"

export default function AgenciesPage() {
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Agencies</h1>
                <div className="flex items-center text-sm text-gray-500">
                    <a href="/" className="hover:text-gray-900">Home</a>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">Agencies</span>
                </div>
            </div>

            <Card className="p-6">
                <h2 className="text-lg font-medium mb-4">Agencies List</h2>
                <p className="text-gray-500">
                    This is a placeholder for the Agencies listing page.
                </p>
            </Card>
        </>
    )
} 