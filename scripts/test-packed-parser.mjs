import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const testFile = join(root, "__tests__", "presentation-4", "packed-package.mjs");
const temporaryRoot = mkdtempSync(join(tmpdir(), "iiif-packed-integration-"));

function pack(packageRoot) {
  const existingTarballs = new Set(readdirSync(temporaryRoot));
  execFileSync("pnpm", ["pack", "--pack-destination", temporaryRoot], {
    cwd: packageRoot,
    stdio: ["ignore", "ignore", "inherit"],
  });
  const tarball = readdirSync(temporaryRoot).find((file) => file.endsWith(".tgz") && !existingTarballs.has(file));
  if (!tarball) throw new Error(`pnpm did not pack ${packageRoot}`);
  return join(temporaryRoot, tarball);
}

function publicSpecifiers(packageName, packageJson) {
  return Object.keys(packageJson.exports || {})
    .filter((subpath) => !subpath.includes("*"))
    .map((subpath) => (subpath === "." ? packageName : `${packageName}${subpath.slice(1)}`));
}

try {
  const helpersPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const parserModuleRoot = realpathSync(join(root, "node_modules", "@iiif", "parser"));
  const parserPackage = JSON.parse(readFileSync(join(parserModuleRoot, "package.json"), "utf8"));
  const helpersTarball = pack(root);
  const configuredParserDependency = helpersPackage.devDependencies["@iiif/parser"];
  const parserDependency = configuredParserDependency.startsWith("workspace:")
    ? `file:${pack(parserModuleRoot)}`
    : configuredParserDependency;
  const allPublicSpecifiers = [
    ...publicSpecifiers("@iiif/parser", parserPackage),
    ...publicSpecifiers("@iiif/helpers", helpersPackage),
  ];
  writeFileSync(
    join(temporaryRoot, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: {
        "@iiif/helpers": `file:${helpersTarball}`,
        "@iiif/parser": parserDependency,
      },
    })
  );
  copyFileSync(testFile, join(temporaryRoot, "packed-package.mjs"));
  writeFileSync(join(temporaryRoot, "public-subpaths.json"), JSON.stringify(allPublicSpecifiers, null, 2));

  execFileSync(
    "pnpm",
    ["install", "--ignore-scripts", "--config.auto-install-peers=false", "--strict-peer-dependencies"],
    { cwd: temporaryRoot, stdio: "inherit" }
  );
  execFileSync(process.execPath, ["packed-package.mjs"], {
    cwd: temporaryRoot,
    stdio: "inherit",
  });

  const typeConsumer = allPublicSpecifiers
    .map(
      (specifier, index) =>
        `import * as publicModule${index} from ${JSON.stringify(specifier)};\nvoid publicModule${index};`
    )
    .join("\n");
  const cjsTypeConsumer = allPublicSpecifiers
    .map(
      (specifier, index) =>
        `import publicModule${index} = require(${JSON.stringify(specifier)});\nvoid publicModule${index};`
    )
    .join("\n");
  writeFileSync(join(temporaryRoot, "consumer.ts"), typeConsumer);
  writeFileSync(join(temporaryRoot, "consumer.cts"), cjsTypeConsumer);

  for (const [name, compilerOptions, consumer] of [
    [
      "nodenext",
      {
        module: "NodeNext",
        moduleResolution: "NodeNext",
      },
      "./consumer.ts",
    ],
    [
      "nodenext-cjs",
      {
        module: "NodeNext",
        moduleResolution: "NodeNext",
      },
      "./consumer.cts",
    ],
    [
      "bundler",
      {
        module: "ESNext",
        moduleResolution: "Bundler",
      },
      "./consumer.ts",
    ],
  ]) {
    const configPath = join(temporaryRoot, `tsconfig.${name}.json`);
    writeFileSync(
      configPath,
      JSON.stringify({
        compilerOptions: {
          ...compilerOptions,
          target: "ES2022",
          strict: true,
          noEmit: true,
          skipLibCheck: false,
        },
        files: [consumer],
      })
    );
    execFileSync("pnpm", ["exec", "tsc", "--project", configPath], {
      cwd: root,
      stdio: "inherit",
    });
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
