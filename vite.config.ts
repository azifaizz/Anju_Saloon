import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/proxy/products": {
        target: "https://product-service-demo4-1013471958286.asia-southeast1.run.app",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/proxy/, "/api"),
        secure: false,
      },
      "/proxy/billing": {
        target: "https://billing-service-demo4-1013471958286.asia-southeast1.run.app",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/proxy/, "/api"),
        secure: false,
      },
      "/proxy/vendors": {
        target: "https://vendor-service-demo4-1013471958286.asia-southeast1.run.app",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/proxy/, "/api"),
        secure: false,
      },
      "/proxy/customers": {
        target: "https://vendor-service-demo4-1013471958286.asia-southeast1.run.app",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/proxy/, "/api"),
        secure: false,
      },
      "/proxy/broker": {
        target: "https://vendor-service-demo4-1013471958286.asia-southeast1.run.app",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/proxy/, "/api"),
        secure: false,
      },
      "/proxy/chit": {
        target: "https://vendor-service-demo4-1013471958286.asia-southeast1.run.app",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/proxy/, "/api"),
        secure: false,
      },
      "/proxy/staff": {
        target: "https://staff-service-demo4-1013471958286.asia-southeast1.run.app",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/proxy/, "/api"),
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
