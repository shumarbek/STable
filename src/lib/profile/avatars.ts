import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg"]);

async function readAvatarFolder(folder: "Boy" | "Girl"): Promise<string[]> {
  const directory = path.join(process.cwd(), "public", "avatars", folder);

  try {
    const files = await readdir(directory, { withFileTypes: true });
    return files
      .filter((file) => file.isFile() && allowedExtensions.has(path.extname(file.name).toLowerCase()))
      .map((file) => `/avatars/${folder}/${encodeURIComponent(file.name)}`)
      .sort((left, right) => left.localeCompare(right, "uz"));
  } catch {
    return [];
  }
}

export async function getProfileAvatars() {
  const [male, female] = await Promise.all([
    readAvatarFolder("Boy"),
    readAvatarFolder("Girl"),
  ]);

  return { male, female };
}
