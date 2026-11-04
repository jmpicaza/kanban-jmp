// npm run dev → recompila al guardar y arranca el servidor. Recarga el navegador para ver los cambios.
import { spawn } from "node:child_process";
import * as esbuild from "esbuild";
import { developmentOptions } from "./esbuild.config.mjs";

const ctx = await esbuild.context(developmentOptions);
await ctx.watch();

const server = spawn(process.env.PYTHON || "python3", ["server/server.py", process.env.PORT || "8000"], { stdio: "inherit" });
const stop = async () => {
  server.kill();
  await ctx.dispose();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("exit", stop);
