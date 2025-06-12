"use client"

import { useState } from "react"
// Custom Switch Component
function CustomSwitch({ checked, onCheckedChange, className = "" }: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void; 
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
        checked ? 'bg-violet-500' : 'bg-gray-200'
      } ${className}`}
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Edit, Plus, Check, X } from "lucide-react"

interface FAQ {
  id: string
  question: string
}

const defaultFAQs: FAQ[] = [
  { id: "1", question: "What benefits does this role include?" },
  { id: "2", question: "Can I work remotely?" },
  { id: "3", question: "What's the company culture like?" },
]

export function FAQManagement() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [faqs, setFaqs] = useState<FAQ[]>(defaultFAQs)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")

  const startEditing = (faq: FAQ) => {
    setEditingId(faq.id)
    setEditingText(faq.question)
  }

  const saveEdit = () => {
    if (editingId && editingText.trim()) {
      setFaqs(faqs.map((faq) => (faq.id === editingId ? { ...faq, question: editingText.trim() } : faq)))
    }
    setEditingId(null)
    setEditingText("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText("")
  }

  const addFAQ = () => {
    const newFAQ: FAQ = {
      id: Date.now().toString(),
      question: "New FAQ question",
    }
    setFaqs([...faqs, newFAQ])
    startEditing(newFAQ)
  }

  return (
    <div className="relative p-[6px] rounded-2xl bg-gradient-to-br from-white via-purple-200  to-purple-500">
      <Card className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 border-0 rounded-xl shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">FAQ Management</CardTitle>
          <p className="text-xs text-gray-600 mt-0.5">Customize which questions your chatbot can answer</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-900">Enable FAQ automation</span>
            <CustomSwitch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="space-y-1">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="flex items-center justify-between p-2 bg-white/60 backdrop-blur-sm rounded-lg hover:bg-white/80 transition-all duration-200"
              >
                {editingId === faq.id ? (
                  <>
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 mr-2 bg-white border-violet-200 focus:border-violet-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit()
                        if (e.key === "Escape") cancelEdit()
                      }}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={saveEdit}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={cancelEdit}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-gray-700 flex-1">{faq.question}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-gray-400 hover:text-violet-600 hover:bg-violet-50"
                      onClick={() => startEditing(faq)}
                    >
                      <Edit className="h-2.5 w-2.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            className="w-full text-violet-600 hover:text-violet-700 hover:bg-white/60 backdrop-blur-sm text-xs py-1"
            onClick={addFAQ}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add FAQ
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
