/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#7155FF", // Dify紫色主色调
                    50: "#F5F2FF",
                    100: "#EBE4FF",
                    200: "#D6CAFF",
                    300: "#B7A4FF",
                    400: "#9880FF",
                    500: "#7155FF", // 主色调
                    600: "#5A3DF7",
                    700: "#4933D2",
                    800: "#3729A3",
                    900: "#28217B"
                },
                secondary: {
                    DEFAULT: "#F5F8FF", // 浅色背景
                    dark: "#E8EFFD"
                },
                gray: {
                    50: "#F9FAFB",
                    100: "#F3F4F6",
                    200: "#E5E7EB",
                    300: "#D1D5DB",
                    400: "#9CA3AF",
                    500: "#6B7280",
                    600: "#4B5563",
                    700: "#374151",
                    800: "#1F2937",
                    900: "#111827"
                },
                accent: {
                    blue: "#3992FF",
                    green: "#4CB782",
                    yellow: "#FFB224",
                    red: "#F87171",
                    purple: "#7155FF"
                },
                dark: "#0D0A29", // 深色文字
            },
            boxShadow: {
                'card': '0 2px 8px 0 rgba(0, 0, 0, 0.04)',
                'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'button': '0 2px 4px 0 rgba(113, 85, 255, 0.25)',
            },
            fontFamily: {
                sans: ['"Inter"', 'sans-serif'],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            },
            fontSize: {
                'xs': '0.75rem',
                'sm': '0.875rem',
                'base': '1rem',
                'lg': '1.125rem',
                'xl': '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.875rem',
                '4xl': '2.25rem',
                '5xl': '3rem',
            },
            transitionProperty: {
                'height': 'height',
                'spacing': 'margin, padding',
            }
        },
    },
    plugins: [],
} 