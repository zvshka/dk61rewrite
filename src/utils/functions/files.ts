import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { env } from '@/env';

/**
 * recursively get files paths from a directory
 * @param path
 */
export function getFiles(path: string): string[] {
  if (!fs.existsSync(path)) return [];

  const files = fs.readdirSync(path);
  const fileList = [];

  for (const file of files) {
    const filePath = `${path}/${file}`;
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) fileList.push(...getFiles(filePath));
    else fileList.push(filePath);
  }

  return fileList;
}

export function fileOrDirectoryExists(path: string): boolean {
  return fs.existsSync(path);
}

export function getSourceCodeLocation(): string {
  return `${process.cwd()}/${env.NODE_ENV === 'production' ? 'build' : 'src'}`;
}

export function toImportPath(p: string): string {
  if (p.startsWith('file://')) return p;
  if (path.isAbsolute(p)) return pathToFileURL(p).href;
  return p;
}
