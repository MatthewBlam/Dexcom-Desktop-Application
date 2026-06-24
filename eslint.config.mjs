import tseslint from "typescript-eslint";

export default tseslint.config(
    tseslint.configs.recommended,
    {
        ignores: [
            ".vite/",
            "dist/",
            "out/",
            "node_modules/",
            "*.config.js",
            "*.config.ts",
        ],
    },
    {
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unsafe-function-type": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/triple-slash-reference": "off",
        },
    },
);
