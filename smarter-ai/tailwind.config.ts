import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["selector", "class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
  	extend: {
			backgroundImage: {
        'custom-gradient': 'linear-gradient(to right, #F0F4FF 0%, #E8EFFF 20%, #D6E0FA 50%, #D8D8F5 75%, #ECE0FF 100%)',
				  'custom-gradientt': 'linear-gradient(to right, #E8EAFF 0%, #FCF0F8 100%)',

      },
  		colors: {
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		keyframes: {
  			hide: {
  				from: {
  					opacity: '1'
  				},
  				to: {
  					opacity: '0'
  				}
  			},
  			slideDownAndFade: {
  				from: {
  					opacity: '0',
  					transform: 'translateY(-6px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			slideLeftAndFade: {
  				from: {
  					opacity: '0',
  					transform: 'translateX(6px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			slideUpAndFade: {
  				from: {
  					opacity: '0',
  					transform: 'translateY(6px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			slideRightAndFade: {
  				from: {
  					opacity: '0',
  					transform: 'translateX(-6px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			dialogOverlayShow: {
  				from: {
  					opacity: '0'
  				},
  				to: {
  					opacity: '1'
  				}
  			},
  			dialogContentShow: {
  				from: {
  					opacity: '0',
  					transform: 'translate(-50%, -45%) scale(0.95)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translate(-50%, -50%) scale(1)'
  				}
  			},
  			drawerSlideLeftAndFade: {
  				from: {
  					opacity: '0',
  					transform: 'translateX(50%)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			}
  		},
  		animation: {
  			hide: 'hide 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  			slideDownAndFade: 'slideDownAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  			slideLeftAndFade: 'slideLeftAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  			slideUpAndFade: 'slideUpAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  			slideRightAndFade: 'slideRightAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  			drawerSlideLeftAndFade: 'drawerSlideLeftAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  			dialogOverlayShow: 'dialogOverlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  			dialogContentShow: 'dialogContentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-animate")],
}
export default config
