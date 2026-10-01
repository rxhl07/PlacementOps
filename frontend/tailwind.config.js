/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                },
                surface: {
                    background: '#f8fafc',
                    card: '#ffffff',
                    border: '#e2e8f0',
                    hover: '#f1f5f9',
                },
                slate: {
                    950: '#020617',
                }
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            boxShadow: {
                'subtle': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
            }
        },
    },
    plugins: [],
};