/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: '#4a3621',
                'background-light': '#f7f7f6',
                'background-dark': '#1d1915',
            },
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui'],
            },
        },
    },
    plugins: [],
}