import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    vue(),
    // Markdown 自动解析插件
    {
      name: "raw-md",
      transform(code, id) {
        if (id.endsWith(".md")) {
          const escapedCode = code
            .replace(/\\/g, "\\\\")
            .replace(/`/g, "\\`")
            .replace(/\$\{/g, "\\${");
          return `export default \`${escapedCode}\`;`;
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
