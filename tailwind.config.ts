import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				app: {
					bgDeep: "var(--app-bg-deep)",
					bgPage: "var(--app-bg-page)",
					bgSurface: "var(--app-bg-surface)",
					bgTile: "var(--app-bg-tile)",
					bgTileSoft: "var(--app-bg-tile-soft)",

					borderSubtle: "var(--app-border-subtle)",
					borderStrong: "var(--app-border-strong)",

					// фон больших панелей (профиль, чат и т.п.) — чуть светлее bgPage
					panel: "#080814",

					// обычные карточки
					card: "#0B0B18",

					// более светлые "мягкие" карточки / области
					cardSoft: "#111122",

					// внутренние слои — инпуты, поля, небольшие блоки
					bgLayer: "#090916",

					// тонкая граница

					// более заметная граница (рамка окна чата и крупных блоков)

					// приглушённый текст (подписи, второстепенный текст)
					muted: "#B3B7D4",

					// ещё более мягкий текст (подписи мелким шрифтом)
					softer: "#7D819F",
					accent: "var(--app-accent)",
					accentSoft: "var(--app-accent-soft)",
					accentStrong: "var(--app-accent-strong)",

					success: "var(--app-success)",
					successSoft: "var(--app-success-soft)",
					danger: "var(--app-danger)",
					dangerSoft: "var(--app-danger-soft)",
					warning: "var(--app-warning)",
					warningSoft: "var(--app-warning-soft)",

					text: "var(--app-text-primary)",
					secondary: "var(--app-text-secondary)",
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				gray:{
					700: 'hsl(260, 30%, 28%)',  // dark muted purple, less bright than before
					800: 'hsl(260, 25%, 18%)',  // very dark purple, good for backgrounds
					900: 'hsl(260, 20%, 10%)',  // almost black with purple tint
					950: 'hsl(260, 20%, 10%)',  // almost black with purple tint

				}

			},
			boxShadow: {
				"glow-violet": "var(--app-glow-violet)",
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
