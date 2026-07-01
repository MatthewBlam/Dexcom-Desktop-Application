import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig } from "vite";
import { pluginExposeRenderer } from "./vite.base.config";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config
export default defineConfig((env) => {
    const forgeEnv = env as ConfigEnv<"renderer">;
    const { root, mode, forgeConfigSelf } = forgeEnv;
    const name = forgeConfigSelf.name ?? "";

    return {
        root: path.join(__dirname, "src", "renderer"),
        mode,
        base: "./",
        build: {
            outDir: path.resolve(__dirname, ".vite", "renderer", name),
            rollupOptions: {
                input: path.resolve(__dirname, "src", "renderer", "index.html"),
                plugins: [
                    copy({
                        targets: [
                            {
                                src: "src/graphics/**/*",
                                dest: ".vite/assets/graphics",
                            },
                        ],
                        hook: "writeBundle",
                    }),
                ],
            },
        },
        plugins: [pluginExposeRenderer(name), tailwindcss()],
        resolve: {
            preserveSymlinks: true,
        },
        clearScreen: false,
    } as UserConfig;
});
