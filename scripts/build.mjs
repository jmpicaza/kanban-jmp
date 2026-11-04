// npm run build → compila a public/ (minificado).
import * as esbuild from "esbuild";
import { productionOptions } from "./esbuild.config.mjs";

await esbuild.build(productionOptions);
