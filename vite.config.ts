import { createHash, webcrypto } from "node:crypto";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

type AlgorithmInput = string | { name?: string | undefined };
type HashData = ArrayBuffer | ArrayBufferView | string;
type HashableCrypto = typeof webcrypto & {
  hash?: (algorithm: AlgorithmInput, data: HashData) => Promise<ArrayBuffer>;
};

const ensureCryptoHashPolyfill = () => {
  const existingCrypto = (globalThis.crypto ?? webcrypto) as HashableCrypto | undefined;
  if (!existingCrypto) {
    return;
  }

  if (typeof existingCrypto.hash !== "function") {
    existingCrypto.hash = async (algorithm: AlgorithmInput, data: HashData) => {
      const algorithmName =
        typeof algorithm === "string"
          ? algorithm
          : typeof algorithm?.name === "string"
            ? algorithm.name
            : "SHA-256";
      const normalized = algorithmName.toLowerCase().replace(/-/g, "");
      const hash = createHash(normalized);

      if (typeof data === "string") {
        hash.update(data);
      } else if (ArrayBuffer.isView(data)) {
        hash.update(Buffer.from(data.buffer, data.byteOffset, data.byteLength));
      } else if (data instanceof ArrayBuffer) {
        hash.update(Buffer.from(data));
      } else {
        throw new TypeError("Unsupported data type for crypto.hash polyfill");
      }

      const digest = hash.digest();
      return digest.buffer.slice(digest.byteOffset, digest.byteOffset + digest.byteLength);
    };
  }

  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, "crypto", {
      value: existingCrypto,
      configurable: true,
      enumerable: false,
      writable: false,
    });
  }
};

ensureCryptoHashPolyfill();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy `/api/coingecko/*` to CoinGecko to avoid CORS issues during local development.
    proxy: {
      "/api/coingecko": {
        target: "https://api.coingecko.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/coingecko/, "/api/v3"),
      },
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: "./src/setupTests.ts",
    css: true,
  },
});
