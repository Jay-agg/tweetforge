import fs from "fs";
import path from "path";

let cachedContext: string | null = null;

export function getProjectContext(): string {
  if (cachedContext) return cachedContext;

  const contextPath = path.resolve(
    process.cwd(),
    "..",
    "project-context.md"
  );

  cachedContext = fs.readFileSync(contextPath, "utf-8");
  return cachedContext;
}
