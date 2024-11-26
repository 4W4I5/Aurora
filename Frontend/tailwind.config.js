/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        supabase: {
          primary: "#00D969", // Primary Green - button fill, graphic fill, sidebar gradient
          secondary: "#054D0A", // Secondary Green - sidebar gradient only
          accent: "#00D969", // Accent Green - only used for specific highlights like forget password text
          neutral: "#d6dee7", // Light neutral color (text, inputs)
          "base-100": "#000000", // New Sidebar Background color (Dark Greenish Blue, now the background)
          "base-200": "#021E21", // Background color + button fill color on login + button outline color for sidebar and dashboard
          "base-300": "#06753d", // Does not do much (perhaps unused in your design)
          grayLight: "#F3F4F6", // Light Gray (backgrounds, light text)
          grayDark: "#6B7280", // Dark Gray (for disabled text/icons)
          white: "#FFFFFF", // Pure white
          red: "#b10000", // Red (error, alert)
          Newbackground1: "#020f21", // New Sidebar Color (Dark Navy, now the sidebar color)
          Newbackground2: "#030712 ", // New Background (Darker Teal)
        },
        // supabase: {
        //   primary: "#1d8644", // Primary Green (for buttons)
        //   secondary: "#009648", // Secondary Green (for links)
        //   accent: "#00D969", // Accent Green
        //   neutral: "#d6dee7", // White for neutral
        //   "base-100": "#020f21", // Very dark blue (adjusted for your preference)
        //   "base-200": "#076034", // Darker base green shade
        //   "base-300": "#06753d", // Darker green shade for contrast
        //   grayLight: "#F3F4F6", // Light Gray (backgrounds)
        //   grayDark: "#6B7280", // Dark Gray (for disabled text/icons)
        //   white: "#FFFFFF", // White
        //   red: "b10000", // Red
        //   Newbackground1: "#1f4d38   ", // New Background
        //   Newbackground2: "#1b4842  ", // New Background
        // },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        Aurora: {
          primary: "#1d8644", // button fill + graphic fill + sidebar gradient
          secondary: "#009648", // Secondary Green, sidebar gradient only
          accent: "#00D969", // Accent Green, nothing besides the forget password text
          neutral: "#d6dee7", // White for neutral
          "base-100": "#020f21", // SideBar color + Cards + Login Gradient
          "base-200": "#076034", // Background color + button fill color on login + button outline color for sidebar and dashboard
          "base-300": "#06753d", // Doesnt do shit
        },
      },
    ],
  },
};
