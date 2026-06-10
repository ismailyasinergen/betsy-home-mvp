import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8EF",
        clay: "#B65F45",
        sage: "#6F826A",
        charcoal: "#2B2522",
        sand: "#E8D8C5"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(44, 37, 34, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
