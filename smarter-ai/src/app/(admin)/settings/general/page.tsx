"use client"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Divider } from "@/components/Divider"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { ProgressBar } from "@/components/ProgressBar"
import { ProgressCircle } from "@/components/ProgressCircle"
import { Switch } from "@/components/Switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { RiExternalLinkLine, RiArrowRightUpLine } from "@remixicon/react"
import { useAuth } from "@/lib/auth"
import { cx } from "@/lib/utils"
import { useState } from "react"

import { roles } from "@/data/data"

const billingData = [
  {
    name: "Starter plan",
    description: "Discounted plan for start-ups and growing companies",
    value: "$0",
  },
  {
    name: "Storage",
    description: "Used 0 GB",
    value: "$0",
    capacity: "0 GB included",
    percentageValue: 0,
  },
  {
    name: "Bandwith",
    description: "Used 0 GB",
    value: "$0",
    capacity: "0 GB included",
    percentageValue: 0,
  },
  {
    name: "Users",
    description: "Used 0",
    value: "$0",
    capacity: "0 users included",
    percentageValue: 0,
  },
  {
    name: "Query super caching (EU-Central 1)",
    description: "0 GB query cache, $0/mo",
    value: "$0.00",
  },
]

export default function General() {
  const { user } = useAuth()
  const [isSpendMgmtEnabled, setIsSpendMgmtEnabled] = useState(true)
  
  const defaultValues = {
    firstName: "",
    lastName: "",
    email: "",
    birthYear: "",
    role: "admin"
  }
  
  const firstName = user?.name?.split(' ')[0] || defaultValues.firstName
  const lastName = user?.name?.split(' ')[1] || defaultValues.lastName
  const email = user?.email || defaultValues.email
  const role = user?.role || defaultValues.role

  return (
    <div className="space-y-12 pb-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          {/* Personal Information Card */}
          <Card className="overflow-hidden rounded-xl">
            <div className="border-b border-gray-200 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                Personal Information
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Manage your personal information and role.
              </p>
            </div>

            <form className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="font-medium">
                      First name
                    </Label>
                    <Input
                      type="text"
                      id="first-name"
                      name="first-name"
                      autoComplete="given-name"
                      placeholder="First name"
                      defaultValue={firstName}
                      disabled
                      className="rounded-lg transition-all hover:border-gray-400 focus:ring-2 dark:hover:border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="font-medium">
                      Last name
                    </Label>
                    <Input
                      type="text"
                      id="last-name"
                      name="last-name"
                      autoComplete="family-name"
                      placeholder="Last name"
                      defaultValue={lastName}
                      disabled
                      className="rounded-lg transition-all hover:border-gray-400 focus:ring-2 dark:hover:border-gray-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium">
                    Email
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Email"
                    defaultValue={email}
                    disabled
                    className="rounded-lg transition-all hover:border-gray-400 focus:ring-2 dark:hover:border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="font-medium">
                    Role
                  </Label>
                  <Select defaultValue={role}>
                    <SelectTrigger
                      name="role"
                      id="role"
                      disabled
                      className="rounded-lg transition-all hover:border-gray-400 focus:ring-2 dark:hover:border-gray-600"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Roles can only be changed by system admin.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled>
                    Save settings
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* Cost Spend Control Card */}
          <Card className="overflow-hidden rounded-xl">
            <div className="border-b border-gray-200 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                Cost spend control
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Set hard caps for on-demand charges.
              </p>
            </div>

            <form className="p-6">
              <div className="flex items-center justify-between rounded-xl bg-gray-50/50 p-4 dark:bg-gray-900/50">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <ProgressCircle
                      value={isSpendMgmtEnabled ? 62.2 : 0}
                      radius={24}
                      strokeWidth={4}
                      className="transition-all duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {isSpendMgmtEnabled ? "62%" : "0%"}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      &#36;0 / 0 (0&#37;)
                    </p>
                    <Label
                      htmlFor="spend-mgmt"
                      className="text-gray-500 dark:text-gray-400"
                    >
                      {isSpendMgmtEnabled ? "Spend management enabled" : "Spend management disabled"}
                    </Label>
                  </div>
                </div>
                <Switch
                  id="spend-mgmt"
                  name="spend-mgmt"
                  checked={isSpendMgmtEnabled}
                  onCheckedChange={() => {
                    setIsSpendMgmtEnabled(!isSpendMgmtEnabled)
                  }}
                  className="transition-opacity"
                />
              </div>

              <div
                className={cx(
                  "transform-gpu overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1.03)]",
                  isSpendMgmtEnabled ? "mt-6 max-h-96" : "max-h-0",
                )}
              >
                <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="font-medium">Set amount ($)</Label>
                      <Input
                        id="hard-cap"
                        name="hard-cap"
                        defaultValue={0}
                        type="number"
                        className="rounded-lg transition-all hover:border-gray-400 focus:ring-2 dark:hover:border-gray-600"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="font-medium">
                        Provide email for notifications
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        placeholder="admin@company.com"
                        type="email"
                        className="rounded-lg transition-all hover:border-gray-400 focus:ring-2 dark:hover:border-gray-600"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button type="submit" className="rounded-lg">Update</Button>
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Billing Overview Card */}
        <Card className="overflow-hidden rounded-xl">
          <div className="border-b border-gray-200 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Billing
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Overview of your current billing cycle based on fixed and on-demand charges.
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-gray-50 p-4 ring-1 ring-inset ring-indigo-200/20 transition-all hover:shadow-md dark:from-indigo-950/20 dark:to-gray-900 dark:ring-indigo-800/20">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                This workspace is currently on free plan
              </h4>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Boost your analytics and unlock advanced features with our premium plans.{" "}
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Compare plans
                  <RiArrowRightUpLine className="size-4 shrink-0" aria-hidden="true" />
                </a>
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800">
              <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-800">
                {billingData.map((item) => (
                  <li 
                    key={item.name} 
                    className="group p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/50"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-gray-50">
                          {item.name}
                        </p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {item.value}
                        </p>
                      </div>
                      <div>
                        {item.percentageValue !== undefined && (
                          <ProgressBar
                            value={item.percentageValue}
                            className="mt-3 overflow-hidden rounded-full [&>*]:h-1.5"
                          />
                        )}
                        <p className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>{item.description}</span>
                          <span>{item.capacity}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                <p className="flex items-center justify-between text-sm font-medium">
                  <span className="text-gray-900 dark:text-gray-50">Total for May 24</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">$0</span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Divider />

      {/* Danger Zone Card */}
      <Card className="overflow-hidden rounded-xl">
        <div className="border-b border-gray-200 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Danger zone
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Manage general workspace. Contact system admin for more information.{" "}
            <a
              href="#"
              className="inline-flex items-center gap-1 text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Learn more
              <RiExternalLinkLine className="size-4 shrink-0" aria-hidden="true" />
            </a>
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="group overflow-hidden rounded-xl border border-red-200 bg-white transition-all hover:border-red-300 hover:shadow-md dark:border-red-900/50 dark:bg-gray-900 dark:hover:border-red-800/50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Leave workspace
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Revoke your access to this team. Other people you have added to
                the workspace will remain.
              </p>
              <div className="mt-4">
                <Button 
                  variant="destructive"
                  className="rounded-lg transition-all hover:bg-red-600 dark:hover:bg-red-900"
                >
                  Leave
                </Button>
              </div>
            </div>
          </div>

          <div className="group overflow-hidden rounded-xl border border-red-200 bg-white transition-all hover:border-red-300 hover:shadow-md dark:border-red-900/50 dark:bg-gray-900 dark:hover:border-red-800/50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Delete workspace
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Revoke your access to this team, because you are not the system
                admin.
              </p>
              <div className="mt-4">
                <Button 
                  variant="destructive"
                  className="rounded-lg transition-all hover:bg-red-600 dark:hover:bg-red-900"
                >
                  Delete workspace
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
