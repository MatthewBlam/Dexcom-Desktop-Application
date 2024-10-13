import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig } from "vite";
import { pluginExposeRenderer } from "./vite.base.config";
import path from "path";

// https://vitejs.dev/config
export default defineConfig((env) => {
    const forgeEnv = env as ConfigEnv<"renderer">;
    const { root, mode, forgeConfigSelf } = forgeEnv;
    const name = forgeConfigSelf.name ?? "";

    return {
        root: path.join(__dirname, "src", "widget"),
        mode,
        base: "./",
        build: {
            outDir: path.resolve(__dirname, ".vite", "renderer", name), // Corrected output path
            rollupOptions: {
                input: path.resolve(__dirname, "src", "widget", "index.html"), // Entry point
            },
        },
        plugins: [pluginExposeRenderer(name)],
        resolve: {
            preserveSymlinks: true,
        },
        clearScreen: false,
    } as UserConfig;
});
