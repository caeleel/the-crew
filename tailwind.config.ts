import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        fade: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0.5' },
        },
      },
      animation: {
        fade: 'fade 0.5s ease-in-out 1s 1 forwards',
      },
    },
  },
  plugins: [],
}
export default config
