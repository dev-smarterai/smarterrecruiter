"use client"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Label } from "@/components/Label"
import { RadioCardGroup, RadioCardItem } from "@/components/RadioCardGroup"
import { RadioGroup, RadioGroupItem } from "@/components/RadioGroup"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { Slider } from "@/components/Slider"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { SVGProps } from "react"
import React, { useEffect, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"

type Region = {
  value: string
  label: string
  multiplier: number
}

type CloudProviderRegions = {
  aws: Region[]
  azure: Region[]
}

const regionOptions: CloudProviderRegions = {
  aws: [
    { value: "us-east-2", label: "Ohio (us-east-2)", multiplier: 1.0 },
    {
      value: "us-east-1",
      label: "N. Virginia (us-east-1)",
      multiplier: 1.1,
    },
    { value: "us-west-2", label: "Oregon (us-west-2)", multiplier: 1.0 },
    {
      value: "eu-central-1",
      label: "Frankfurt (eu-central-1)",
      multiplier: 1.2,
    },
    { value: "eu-west-1", label: "Ireland (eu-west-1)", multiplier: 1.2 },
    { value: "eu-west-2", label: "London (eu-west-2)", multiplier: 1.3 },
    {
      value: "ap-northeast-1",
      label: "Tokyo (ap-northeast-1)",
      multiplier: 1.4,
    },
    { value: "ap-south-1", label: "Mumbai (ap-south-1)", multiplier: 0.9 },
    {
      value: "ap-southeast-1",
      label: "Singapore (ap-southeast-1)",
      multiplier: 1.3,
    },
    {
      value: "ap-southeast-2",
      label: "Sydney (ap-southeast-2)",
      multiplier: 1.3,
    },
    { value: "eu-west-3", label: "Paris (eu-west-3)", multiplier: 1.2 },
    {
      value: "ap-northeast-2",
      label: "Seoul (ap-northeast-2)",
      multiplier: 1.4,
    },
    { value: "sa-east-1", label: "São Paulo (sa-east-1)", multiplier: 1.5 },
    {
      value: "ca-central-1",
      label: "Montreal (ca-central-1)",
      multiplier: 1.1,
    },
  ],
  azure: [
    { value: "eastus", label: "East US (eastus)", multiplier: 1.0 },
    { value: "eastus2", label: "East US 2 (eastus2)", multiplier: 1.1 },
    {
      value: "southcentralus",
      label: "South Central US (southcentralus)",
      multiplier: 1.2,
    },
    { value: "westus2", label: "West US 2 (westus2)", multiplier: 1.0 },
    {
      value: "germanywestcentral",
      label: "Germany West Central (germanywestcentral)",
      multiplier: 1.3,
    },
    {
      value: "switzerlandnorth",
      label: "Switzerland North (switzerlandnorth)",
      multiplier: 1.4,
    },
  ],
}

const MicrosoftAzure = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 96 96"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    {...props}
  >
    <defs>
      <linearGradient
        id="a"
        x1={-1032.17}
        x2={-1059.21}
        y1={145.31}
        y2={65.43}
        gradientTransform="matrix(1 0 0 -1 1075 158)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#114a8b" />
        <stop offset={1} stopColor="#0669bc" />
      </linearGradient>
      <linearGradient
        id="b"
        x1={-1023.73}
        x2={-1029.98}
        y1={108.08}
        y2={105.97}
        gradientTransform="matrix(1 0 0 -1 1075 158)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopOpacity={0.3} />
        <stop offset={0.07} stopOpacity={0.2} />
        <stop offset={0.32} stopOpacity={0.1} />
        <stop offset={0.62} stopOpacity={0.05} />
        <stop offset={1} stopOpacity={0} />
      </linearGradient>
      <linearGradient
        id="c"
        x1={-1027.16}
        x2={-997.48}
        y1={147.64}
        y2={68.56}
        gradientTransform="matrix(1 0 0 -1 1075 158)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#3ccbf4" />
        <stop offset={1} stopColor="#2892df" />
      </linearGradient>
    </defs>
    <path
      fill="url(#a)"
      d="M33.34 6.54h26.04l-27.03 80.1a4.15 4.15 0 0 1-3.94 2.81H8.15a4.14 4.14 0 0 1-3.93-5.47L29.4 9.38a4.15 4.15 0 0 1 3.94-2.83z"
    />
    <path
      fill="#0078d4"
      d="M71.17 60.26H29.88a1.91 1.91 0 0 0-1.3 3.31l26.53 24.76a4.17 4.17 0 0 0 2.85 1.13h23.38z"
    />
    <path
      fill="url(#b)"
      d="M33.34 6.54a4.12 4.12 0 0 0-3.95 2.88L4.25 83.92a4.14 4.14 0 0 0 3.91 5.54h20.79a4.44 4.44 0 0 0 3.4-2.9l5.02-14.78 17.91 16.7a4.24 4.24 0 0 0 2.67.97h23.29L71.02 60.26H41.24L59.47 6.55z"
    />
    <path
      fill="url(#c)"
      d="M66.6 9.36a4.14 4.14 0 0 0-3.93-2.82H33.65a4.15 4.15 0 0 1 3.93 2.82l25.18 74.62a4.15 4.15 0 0 1-3.93 5.48h29.02a4.15 4.15 0 0 0 3.93-5.48z"
    />
  </svg>
)

const AmazonWebServices = (props: SVGProps<SVGSVGElement>) => (
  <svg
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    x={0}
    y={0}
    viewBox="0 0 304 182"
    style={
      {
        enableBackground: "new 0 0 304 182",
      } as React.CSSProperties
    }
    xmlSpace="preserve"
    width="1em"
    height="1em"
    {...props}
  >
    <style>
      {"\n    .st1{fill-rule:evenodd;clip-rule:evenodd;fill:#f90}\n  "}
    </style>
    <path
      d="m86 66 2 9c0 3 1 5 3 8v2l-1 3-7 4-2 1-3-1-4-5-3-6c-8 9-18 14-29 14-9 0-16-3-20-8-5-4-8-11-8-19s3-15 9-20c6-6 14-8 25-8a79 79 0 0 1 22 3v-7c0-8-2-13-5-16-3-4-8-5-16-5l-11 1a80 80 0 0 0-14 5h-2c-1 0-2-1-2-3v-5l1-3c0-1 1-2 3-2l12-5 16-2c12 0 20 3 26 8 5 6 8 14 8 25v32zM46 82l10-2c4-1 7-4 10-7l3-6 1-9v-4a84 84 0 0 0-19-2c-6 0-11 1-15 4-3 2-4 6-4 11s1 8 3 11c3 2 6 4 11 4zm80 10-4-1-2-3-23-78-1-4 2-2h10l4 1 2 4 17 66 15-66 2-4 4-1h8l4 1 2 4 16 67 17-67 2-4 4-1h9zm129 3a66 66 0 0 1-27-6l-3-3-1-2v-5c0-2 1-3 2-3h2l3 1a54 54 0 0 0 23 5c6 0 11-2 14-4 4-2 5-5 5-9l-2-7-10-5-15-5c-7-2-13-6-16-10a24 24 0 0 1 5-34l10-5a44 44 0 0 1 20-2 110 110 0 0 1 12 3l4 2 3 2 1 4v4c0 3-1 4-2 4l-4-2c-6-2-12-3-19-3-6 0-11 0-14 2s-4 5-4 9c0 3 1 5 3 7s5 4 11 6l14 4c7 3 12 6 15 10s5 9 5 14l-3 12-7 8c-3 3-7 5-11 6l-14 2z"
      style={{
        fill: "#252f3e dark:#ffffff",
      }}
    />
    <path
      className="st1"
      d="M274 144A220 220 0 0 1 4 124c-4-3-1-6 2-4a300 300 0 0 0 263 16c5-2 10 4 5 8z"
    />
    <path
      className="st1"
      d="M287 128c-4-5-28-3-38-1-4 0-4-3-1-5 19-13 50-9 53-5 4 5-1 36-18 51-3 2-6 1-5-2 5-10 13-33 9-38z"
    />
  </svg>
)

const cloudProviderIcons = {
  aws: AmazonWebServices,
  azure: MicrosoftAzure,
}

export default function PricingCalculator() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [cloudProvider, setCloudProvider] = React.useState<"aws" | "azure">("aws")
  const [region, setRegion] = React.useState(regionOptions.aws[0].value)
  const [storageVolume, setStorageVolume] = React.useState(6)
  const [activeHours, setActiveHours] = React.useState([6])
  const [compression, setCompression] = React.useState("false")
  const { user } = useAuth()
  
  // Get the completeOnboarding mutation
  const completeOnboardingMutation = useMutation(api.users.completeOnboarding)

  useEffect(() => {
    if (regionOptions[cloudProvider].length > 0) {
      setRegion(regionOptions[cloudProvider][0].value)
    }
  }, [cloudProvider])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    // Make sure user exists and has an ID before proceeding
    if (!user || !user._id) {
      console.error("No valid user found");
      setLoading(false);
      return;
    }
    
    console.log("Calling completeOnboarding with userId:", user._id);
    
    // Call the Convex mutation to complete onboarding
    completeOnboardingMutation({ userId: user._id })
      .then(result => {
        console.log("Onboarding completed:", result);
        
        // If user is admin, redirect to dashboard
        if (user?.role === "admin") {
          router.push("/home")
        } else {
          // For regular users, redirect to application form
          router.push("/application-form")
        }
      })
      .catch(error => {
        console.error("Error completing onboarding:", error);
        setLoading(false);
      });
  }

  const calculatePrice = () => {
    const basePrices = {
      aws: 0.023,
      azure: 0.025,
    }

    const activeHourMultiplier = 0.05
    const compressionMultiplier = compression === "true" ? 0.7 : 1.0

    const basePrice = basePrices[cloudProvider]
    const selectedRegion = regionOptions[cloudProvider].find(
      (r) => r.value === region,
    )
    const regionMultiplier = selectedRegion?.multiplier || 1.0
    const storagePrice =
      basePrice * storageVolume * regionMultiplier * compressionMultiplier
    const activeHoursPrice = activeHours[0] * activeHourMultiplier

    const total = storagePrice + activeHoursPrice
    const formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(total)

    return formattedPrice
  }

  const ProviderIcon = cloudProviderIcons[cloudProvider]

  return (
    <main className="mx-auto p-4">
      <div
        className="motion-safe:animate-revealBottom"
        style={{ animationDuration: "500ms" }}
      >
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
          Configure your infrastructure
        </h1>
        <p className="mt-6 text-gray-700 sm:text-sm dark:text-gray-300">
          Select your cloud provider and configure your resources.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="space-y-6">
          <div
            className="motion-safe:animate-revealBottom"
            style={{
              animationDuration: "600ms",
              animationDelay: "150ms",
              animationFillMode: "backwards",
            }}
          >
            <Label htmlFor="cloudProvider">Cloud Provider</Label>
            <RadioCardGroup
              className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2"
              value={cloudProvider}
              onValueChange={(value) => setCloudProvider(value as "aws" | "azure")}
              aria-label="Cloud Provider"
            >
              <RadioCardItem
                className="active:scale-[99%] dark:bg-gray-925"
                value="aws"
                id="aws"
              >
                <div className="flex items-center gap-3">
                  <ProviderIcon className="size-6" />
                  <span className="font-medium sm:text-sm">
                    Amazon Web Services
                  </span>
                </div>
              </RadioCardItem>
              <RadioCardItem
                className="active:scale-[99%] dark:bg-gray-925"
                value="azure"
                id="azure"
              >
                <div className="flex items-center gap-3">
                  <ProviderIcon className="size-6" />
                  <span className="font-medium sm:text-sm">
                    Microsoft Azure
                  </span>
                </div>
              </RadioCardItem>
            </RadioCardGroup>
          </div>

          <div
            className="motion-safe:animate-revealBottom"
            style={{
              animationDuration: "600ms",
              animationDelay: "200ms",
              animationFillMode: "backwards",
            }}
          >
            <Label htmlFor="region">Region</Label>
            <Select
              value={region}
              onValueChange={setRegion}
              aria-label="Region Selection"
            >
              <SelectTrigger id="region" className="mt-2 w-full">
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                {regionOptions[cloudProvider].map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className="motion-safe:animate-revealBottom"
            style={{
              animationDuration: "600ms",
              animationDelay: "250ms",
              animationFillMode: "backwards",
            }}
          >
            <Label htmlFor="storageVolume">
              Storage Volume (GB){" "}
              <span className="text-gray-500">({storageVolume} GB)</span>
            </Label>
            <Slider
              id="storageVolume"
              className="mt-2"
              value={[storageVolume]}
              min={1}
              max={20}
              step={1}
              onValueChange={(value) => setStorageVolume(value[0])}
            />
          </div>

          <div
            className="motion-safe:animate-revealBottom"
            style={{
              animationDuration: "600ms",
              animationDelay: "300ms",
              animationFillMode: "backwards",
            }}
          >
            <Label htmlFor="activeHours">
              Active Hours{" "}
              <span className="text-gray-500">({activeHours[0]} hours)</span>
            </Label>
            <Slider
              id="activeHours"
              className="mt-2"
              value={activeHours}
              min={1}
              max={24}
              step={1}
              onValueChange={setActiveHours}
            />
          </div>

          <div
            className="motion-safe:animate-revealBottom"
            style={{
              animationDuration: "600ms",
              animationDelay: "350ms",
              animationFillMode: "backwards",
            }}
          >
            <Label htmlFor="compression">Compression</Label>
            <RadioGroup
              value={compression}
              onValueChange={setCompression}
              className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
              aria-label="Compression Options"
            >
              <Label
                htmlFor="compression-disabled"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition-all hover:border-indigo-600 has-[:checked]:border-indigo-600 dark:border-gray-700 hover:dark:border-indigo-400 has-[:checked]:dark:border-indigo-400"
              >
                <RadioGroupItem
                  value="false"
                  id="compression-disabled"
                  className="mt-0"
                />
                <span className="block text-sm">Disabled</span>
              </Label>
              <Label
                htmlFor="compression-enabled"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition-all hover:border-indigo-600 has-[:checked]:border-indigo-600 dark:border-gray-700 hover:dark:border-indigo-400 has-[:checked]:dark:border-indigo-400"
              >
                <RadioGroupItem
                  value="true"
                  id="compression-enabled"
                  className="mt-0"
                />
                <span className="block text-sm">Enabled</span>
              </Label>
            </RadioGroup>
          </div>

          <Card className="motion-safe:animate-revealBottom bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-medium">Estimated Cost</h3>
                <p className="text-indigo-600 dark:text-indigo-300">
                  Monthly recurring
                </p>
              </div>
              <div className="text-3xl font-bold">{calculatePrice()}</div>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="ghost" asChild>
            <Link href="/onboarding/employees">Back</Link>
          </Button>
          <Button
            type="submit"
            disabled={loading}
            aria-disabled={loading}
            isLoading={loading}
          >
            {loading ? "Submitting..." : "Finish Setup"}
          </Button>
        </div>
      </form>
    </main>
  )
} 