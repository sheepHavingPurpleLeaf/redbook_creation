/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: "#FF2442", // Xiaohongshu red color
                secondary: "#FDF7F8",
            },
        },
    },
    plugins: [],
} 