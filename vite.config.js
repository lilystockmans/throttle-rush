// Instellingen voor Vite (de lokale server en de bouwstap).
// three.js alleen al is ongeveer 550 kB. Daarom zetten we de waarschuwingsgrens voor
// "te groot bestand" iets hoger: na compressie (gzip) is de hele game ongeveer 156 kB.
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700, // kB
  },
});
