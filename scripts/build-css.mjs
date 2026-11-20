import fs from "fs";
import path from "path";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

const rootDir = process.cwd();
const srcPath = path.resolve(rootDir, "app/globals.src.css");
const outPath = path.resolve(rootDir, "app/globals.css");

const css = fs.readFileSync(srcPath, "utf-8");
const compiler = await compile(css, {
  base: rootDir,
  onDependency: () => {},
});

const scanner = new Scanner({
  sources: [
    { base: path.resolve(rootDir, "app"), pattern: "**/*.{tsx,ts,jsx,js}", negated: false },
    { base: path.resolve(rootDir, "components"), pattern: "**/*.{tsx,ts,jsx,js}", negated: false },
    { base: path.resolve(rootDir, "lib"), pattern: "**/*.{tsx,ts,jsx,js}", negated: false },
  ],
});

const candidates = scanner.scan();
const builtCss = compiler.build(candidates);

fs.writeFileSync(outPath, builtCss, "utf-8");
console.log(`[Tailwind CSS v4] Successfully compiled ${candidates.length} candidate classes -> app/globals.css (${(builtCss.length / 1024).toFixed(1)} KB)`);
