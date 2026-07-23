/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#009b93",
        secondary: "#005e59",
        accent: "#00a651",
      },
    },
  },
  safelist: [
    'bg-green-50',
    'text-green-600',
    'text-green-700',
    'bg-green-600',
    'bg-blue-50',
    'text-blue-600',
    'bg-purple-50',
    'text-purple-600',
    'bg-red-50',
    'text-red-600',
    'bg-amber-50',
    'text-amber-600',
    'text-amber-700',
    'bg-slate-50',
    'text-slate-600',
  ],
  plugins: [],
}