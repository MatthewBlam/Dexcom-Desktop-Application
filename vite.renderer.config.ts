import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig } from "vite";
import { pluginExposeRenderer } from "./vite.base.config";
import path from "path";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config
export default defineConfig((env) => {
    const forgeEnv = env as ConfigEnv<"renderer">;
    const { root, mode, forgeConfigSelf } = forgeEnv;
    const name = forgeConfigSelf.name ?? "";

    return {
        root: path.join(__dirname, "src", "main"),
        mode,
        base: "./",
        build: {
            outDir: path.resolve(__dirname, ".vite", "renderer", name), // Corrected output path
            rollupOptions: {
                input: path.resolve(__dirname, "src", "main", "index.html"), // Entry point
                plugins: [
                    copy({
                        targets: [
                            {
                                src: "src/dexcom",
                                dest: ".vite/assets",
                            }, // Copy assets
                            {
                                src: "src/graphics/**/*",
                                dest: ".vite/assets/graphics",
                            }, // Copy styles
                        ],
                        hook: "writeBundle", // Copy assets after build completion
                    }),
                ],
            },
        },
        hooks: {
            postPackage: async (forgeConfig: any, options: any) => {
                console.info("Packages built at:", options.outputPaths);
                console.log("Packages built at:", options.outputPaths);
            },
        },
        plugins: [pluginExposeRenderer(name)],
        resolve: {
            preserveSymlinks: true,
        },
        clearScreen: false,
    } as UserConfig;
});
