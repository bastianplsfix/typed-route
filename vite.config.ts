import tsdownConfig from "./tsdown.config.ts";

import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: tsdownConfig,
  lint: { "options": { "typeAware": true, "typeCheck": true } },
});
