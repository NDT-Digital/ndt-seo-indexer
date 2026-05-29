import { createWriteStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { OutputWriter } from "../../domain/types";
import { normalizeRelativeFilePath } from "../../utils/path";

export class FilesystemOutputWriter implements OutputWriter {
  private readonly baseDirectory: string;

  constructor(directory: string) {
    this.baseDirectory = resolve(process.cwd(), directory);
  }

  async prepare(clean = false): Promise<void> {
    if (clean) {
      await rm(this.baseDirectory, { force: true, recursive: true });
    }

    await mkdir(this.baseDirectory, { recursive: true });
  }

  async writeText(relativePath: string, content: string): Promise<void> {
    const targetPath = this.resolvePath(relativePath);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, content, "utf8");
  }

  async createWriteStream(
    relativePath: string,
  ): Promise<NodeJS.WritableStream> {
    const targetPath = this.resolvePath(relativePath);
    await mkdir(dirname(targetPath), { recursive: true });

    return createWriteStream(targetPath, { encoding: "utf8" });
  }

  resolvePath(relativePath: string): string {
    return resolve(this.baseDirectory, normalizeRelativeFilePath(relativePath));
  }
}
