import { thumbnailFixtures } from "./fixtures.mjs";
import fetch from "node-fetch";
import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

async function main() {
  await mkdir(path.join("./fixtures", "thumbnails"), { recursive: true });
  const promises = [];

  for (const fixture of thumbnailFixtures) {
    promises.push(
      (async () => {
        const text = await (await fetch(fixture.url)).text();
        await writeFile(path.join("./fixtures", "thumbnails", `${fixture.label}.json`), text);
      })()
    );
    //
  }

  await Promise.all(promises);
}

main().then(() => {
  console.log("Done!");
});
