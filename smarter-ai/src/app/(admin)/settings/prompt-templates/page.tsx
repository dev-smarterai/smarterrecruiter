"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import Link from "next/link"

export default function PromptTemplatesPage() {
    const [promptTemplate, setPromptTemplate] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

    // Load the current prompt template
    useEffect(() => {
        const fetchPrompt = async () => {
            try {
                const response = await fetch('/api/prompt-templates/cv-analysis')
                if (response.ok) {
                    const data = await response.json()
                    setPromptTemplate(data.prompt)
                } else {
                    console.error('Failed to fetch prompt template')
                    // Set a default template as fallback
                    setPromptTemplate(`You are an expert AI recruiter assistant that analyzes candidate CVs. I will provide you with CV/resume content, and I need you to:

1. Extract and evaluate the candidate's technical skills
2. Assess their soft skills based on achievements and experience
3. Identify cultural fit indicators
4. Extract educational background and career progression
5. Highlight the most impressive achievements
6. Provide key insights about the candidate's strengths and weaknesses
7. Estimate their competence in various areas with numerical scores

Format your response as a JSON object with the appropriate structure.
`)
                }
            } catch (error) {
                console.error('Error fetching prompt template:', error)
            }
        }

        fetchPrompt()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        setSavedStatus('saving')

        try {
            const response = await fetch('/api/prompt-templates/cv-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: promptTemplate }),
            })

            if (response.ok) {
                setSavedStatus('saved')
                setTimeout(() => setSavedStatus('idle'), 3000)
            } else {
                setSavedStatus('error')
            }
        } catch (error) {
            console.error('Error saving prompt template:', error)
            setSavedStatus('error')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Prompt Templates</h1>
                <div className="flex items-center text-sm text-gray-500">
                    <Link href="/" className="hover:text-gray-900">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/settings" className="hover:text-gray-900">Settings</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">Prompt Templates</span>
                </div>
            </div>

            <Card className="p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">CV Analysis Prompt Template</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        This prompt is used by OpenAI to analyze candidate CVs. Edit it to customize how the AI evaluates resumes.
                    </p>
                </div>

                <div className="mb-6">
                    <textarea
                        className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm"
                        value={promptTemplate}
                        onChange={(e) => setPromptTemplate(e.target.value)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        {savedStatus === 'saving' && (
                            <span className="text-gray-500">Saving...</span>
                        )}
                        {savedStatus === 'saved' && (
                            <span className="text-green-500">✓ Saved successfully</span>
                        )}
                        {savedStatus === 'error' && (
                            <span className="text-red-500">Error saving template</span>
                        )}
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </Button>
                </div>
            </Card>

            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Tips for Effective Prompts</h3>
                <Card className="p-6">
                    <ul className="space-y-2 text-sm">
                        <li>• Be specific about what skills and attributes you want to evaluate</li>
                        <li>• Include clear instructions on how to score different aspects</li>
                        <li>• Specify the expected output format in detail</li>
                        <li>• Emphasize what's most important for your recruiting process</li>
                        <li>• Include examples if you want the AI to follow a particular style</li>
                    </ul>
                </Card>
            </div>
        </>
    )
} 