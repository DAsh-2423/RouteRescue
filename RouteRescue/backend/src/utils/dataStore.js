import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const dataDir = path.resolve(here, '../data');
const files = ['users','cities','transport','hotels','journeys','feedback','requests'];
export async function readData(name) {
  const file = path.join(dataDir, `${name}.json`);
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return []; throw new Error(`Data file ${name}.json is invalid. Restore it from seed data.`); }
}
export async function writeData(name, value) {
  await fs.mkdir(dataDir, { recursive: true });
  const file = path.join(dataDir, `${name}.json`);
  const temp = `${file}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(temp, file);
}
export async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });
  for (const name of files) {
    try { await fs.access(path.join(dataDir, `${name}.json`)); }
    catch { await writeData(name, []); }
  }
}
