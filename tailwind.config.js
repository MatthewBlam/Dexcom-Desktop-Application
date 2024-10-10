/** @type {import('tailwindcss').Config} */

module.exports = {
    content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
    theme: {
        extend: {
            transitionProperty: {
                top: "top",
            },
            colors: {
                "dex-bg": "#ffffff",
                "dex-fg": "#e6e6e6",
                "dex-fg-light": "#f5f5f5",
                "dex-fg-dark": "#cccccc",
                "dex-text": "#1a1a1a",
                "dex-text-muted": "#757575",
                "dex-text-light": "#a8a8a8",
                "dex-green": "#32a612",
                "dex-green-hover": "#2f9911",
                "dex-yellow": "#ffcc3d",
                "dex-red": "#f73d45",
                "dex-red-hover": "#f8545c",
                "dex-gray": "#3f4955",
            },
            dropShadow: {
                ms: "0 1px 1px rgb(0 0 0 / 0.1)",
                "3xl": "0 0 30px rgba(0, 0, 0, 0.15)",
            },
            fontFamily: {
                sans: [
                    '"Inter"',
                    "system-ui",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    '"Segoe UI"',
                    "Roboto",
                    '"Helvetica Neue"',
                    "Arial",
                    '"Noto Sans"',
                    "sans-serif",
                    '"Apple Color Emoji"',
                    '"Segoe UI Emoji"',
                    '"Segoe UI Symbol"',
                    '"Noto Color Emoji"',
                ],
            },
            scale: {
                dscale: "var(--dscale)",
            },
        },
    },
    plugins: [],
};
