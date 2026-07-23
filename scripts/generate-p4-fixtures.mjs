#!/usr/bin/env node

/**
 * Generate P4 fixtures by upgrading existing P3 cookbook fixtures.
 *
 * Usage:
 *   node scripts/generate-p4-fixtures.mjs
 *
 * This reads every JSON file in fixtures/cookbook/ and fixtures/presentation-3/,
 * upgrades each to Presentation 4 using the parser's upgrader, and writes the
 * result into fixtures/presentation-4/upgraded-from-p3/.
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { upgradeToPresentation4 } from "@iiif/parser/presentation-4";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, "..");

const outputDir = join(root, "fixtures/presentation-4/upgraded-from-p3");

if (!existsSync(outputDir)) {
	mkdirSync(outputDir, { recursive: true });
}

const sourceDirs = [
	{ dir: join(root, "fixtures/cookbook"), prefix: "cookbook" },
	{ dir: join(root, "fixtures/presentation-3"), prefix: "p3" },
];

let totalProcessed = 0;
let totalErrors = 0;

for (const { dir, prefix } of sourceDirs) {
	if (!existsSync(dir)) {
		console.warn(`Skipping ${dir} – directory not found`);
		continue;
	}

	const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

	for (const file of files) {
		const inputPath = join(dir, file);
		const outputName = `${prefix}--${file}`;
		const outputPath = join(outputDir, outputName);

		try {
			const raw = readFileSync(inputPath, "utf8");
			const json = JSON.parse(raw);
			const upgraded = upgradeToPresentation4(json);
			writeFileSync(outputPath, JSON.stringify(upgraded, null, 2) + "\n");
			totalProcessed++;
			console.log(`✓ ${outputName}`);
		} catch (err) {
			totalErrors++;
			console.error(`✗ ${outputName}: ${err.message}`);
		}
	}
}

console.log(`\nDone. ${totalProcessed} upgraded, ${totalErrors} errors.`);
console.log(`Output: ${outputDir}`);
