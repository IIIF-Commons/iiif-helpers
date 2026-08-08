import type { Vault } from "../dist/vault.cjs";

declare function getGlobalVault(): Vault;

export = getGlobalVault;
