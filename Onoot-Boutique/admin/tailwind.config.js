/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: 'var(--color-border)',
                input: 'var(--color-border)',
                ring: 'var(--color-primary)',
                background: 'var(--color-background)',
                foreground: 'var(--color-foreground)',
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    foreground: 'var(--color-primary-foreground)',
                },
                card: {
                    DEFAULT: 'var(--color-card)',
                    foreground: 'var(--color-card-foreground)',
                },
                accent: {
                    blue: 'var(--color-accent-blue)',
                    yellow: 'var(--color-accent-yellow)',
                },
                muted: {
                    DEFAULT: 'var(--color-muted)',
                    foreground: 'var(--color-muted-foreground)',
                }
            }
        },
    },
    plugins: [],
}