export const siteConfig = {
  name: "Dashboard",
  url: "",
  description: "",
  baseLinks: {
    home: "/",
    overview: "/overview",
    details: "/details",
    avatar: "/avatar",
    jobs: "/jobs",
    dashboard: "/dashboard",
    settings: {
      general: "/settings/general",
      billing: "/settings/billing",
      users: "/settings/users",
    },
    onboarding: "/onboarding/products",
  },
}

export type siteConfig = typeof siteConfig
