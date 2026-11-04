// Configuración común de esbuild: src/main.jsx (y su CSS) → public/app.js y public/app.css.
export const baseOptions = {
  entryPoints: ["src/main.jsx"],
  bundle: true,
  outdir: "public",
  entryNames: "app",
  jsx: "automatic",
  logLevel: "info",
};

export const productionOptions = {
  ...baseOptions,
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
};

export const developmentOptions = {
  ...baseOptions,
  minify: false,
  sourcemap: true,
  define: { "process.env.NODE_ENV": '"development"' },
};
