"use client"
import { badgeVariants } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Checkbox } from "@/components/Checkbox"
import { Label } from "@/components/Label"
import { cx } from "@/lib/utils"
import { useRouter } from "next/navigation"
import React from "react"

interface Category {
  id: string
  title: string
  subcategories: string[]
}

interface CheckedItems {
  [categoryId: string]: boolean
}

interface CategoryItemProps {
  category: Category
  checked: boolean
  onCheckedChange: (categoryId: string, checked: boolean) => void
}

const categories: Category[] = [
  {
    id: "1",
    title: "AI Recruitment Assistant",
    subcategories: [
      "Job Description Generator",
      "Interview Question Suggestions",
      "Candidate Matching",
    ],
  },
  {
    id: "2",
    title: "AI Interviewer",
    subcategories: ["Automated Interviews", "Custom Question Sets", "Performance Analytics"],
  },
  {
    id: "3",
    title: "Candidate Management",
    subcategories: ["Resume Parsing", "Applicant Tracking", "Talent Pipeline"],
  },
  {
    id: "4",
    title: "Job Posting & Management",
    subcategories: ["Multi-channel Publishing", "Application Monitoring", "Position Analytics"],
  },
  {
    id: "5",
    title: "Applicant Experience",
    subcategories: ["Custom Application Forms", "AI Chatbot Support", "Status Updates"],
  },
  {
    id: "6",
    title: "Hiring Analytics",
    subcategories: ["Recruitment Funnel", "Time-to-Hire Metrics", "Diversity Insights"],
  },
  {
    id: "7",
    title: "Collaboration Tools",
    subcategories: ["Team Feedback", "Interview Scheduling", "Hiring Decision Support"],
  },
]

const CategoryItem = ({
  category,
  checked,
  onCheckedChange,
}: CategoryItemProps) => {
  return (
    <Card
      asChild
      className={cx(
        "cursor-pointer border-gray-300 p-5 transition-all active:scale-[99%] dark:border-gray-800",
        "has-[:checked]:border-indigo-600",
        "duration-500 has-[:checked]:dark:border-indigo-400",
        // base
        "focus-within:ring-2",
        // ring color
        "focus-within:ring-indigo-200 focus-within:dark:ring-indigo-700/30",
        // border color
        "focus-within:border-indigo-600 focus-within:dark:border-indigo-400",
      )}
    >
      <Label className="block" htmlFor={category.id}>
        <div className="mb-2 flex items-center gap-2.5">
          <Checkbox
            id={category.id}
            name={category.title}
            checked={checked}
            onCheckedChange={(isChecked) =>
              onCheckedChange(category.id, isChecked === true)
            }
          />
          <span className="text-base font-medium sm:text-sm">
            {category.title}
          </span>
        </div>
        {category.subcategories.length > 0 && (
          <ul className="ml-6 mt-2 flex flex-wrap gap-1.5">
            {category.subcategories.map((subcategory) => (
              <li
                className={badgeVariants({ variant: "neutral" })}
                key={subcategory}
              >
                {subcategory}
              </li>
            ))}
          </ul>
        )}
      </Label>
    </Card>
  )
}

export default function Products() {
  const [checkedItems, setCheckedItems] = React.useState<CheckedItems>({})
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleCheckedChange = (categoryId: string, isChecked: boolean) => {
    setCheckedItems((prevCheckedItems) => ({
      ...prevCheckedItems,
      [categoryId]: isChecked,
    }))
  }

  const isAnyItemChecked = Object.values(checkedItems).some(Boolean)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      console.log("Form submitted:", checkedItems)
      // Continue to the next onboarding step
      router.push("/onboarding/employees")
    }, 400)
  }

  return (
    <main className="mx-auto p-4">
      <div
        style={{ animationDuration: "500ms" }}
        className="motion-safe:animate-revealBottom"
      >
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
          Which products are you interested in?
        </h1>
        <p className="mt-6 text-gray-700 sm:text-sm dark:text-gray-300">
          You can choose multiple. This will help us customize the experience.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-4">
        <fieldset>
          <legend className="sr-only">
            Select products you are interested in
          </legend>
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div
                className="motion-safe:animate-revealBottom"
                key={category.id}
                style={{
                  animationDuration: "600ms",
                  animationDelay: `${100 + index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <CategoryItem
                  key={category.id}
                  category={category}
                  checked={checkedItems[category.id] || false}
                  onCheckedChange={handleCheckedChange}
                />
              </div>
            ))}
          </div>
        </fieldset>
        <div className="mt-6 flex justify-end">
          <Button
            className="disabled:bg-gray-200 disabled:text-gray-500"
            type="submit"
            disabled={!isAnyItemChecked || loading}
            aria-disabled={!isAnyItemChecked || loading}
            isLoading={loading}
          >
            {loading ? "Submitting..." : "Continue"}
          </Button>
        </div>
      </form>
    </main>
  )
} 