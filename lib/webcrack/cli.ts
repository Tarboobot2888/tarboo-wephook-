#!/usr/bin/env node

import { program } from 'commander';
import debug from 'debug';
import { existsSync, readFileSync } from 'fs';
import { readFile, rm } from 'fs/promises';
import { join } from 'path';
import * as url from 'url';
import { webcrack } from './index.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const { version, description } = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
) as { version: string; description: string };

debug.enable('webcrack:*');

interface Options {
  force: boolean;
  output?: string;
  mangle: boolean;
  jsx: boolean;
  unpack: boolean;
  deobfuscate: boolean;
  unminify: boolean;
}

async function readStdin() {
  let data = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

program
  .version(version)
  .description(description)
  .option('-o, --output <path>', 'output directory for bundled files')
  .option('-f, --force', 'overwrite output directory')
  .option('-m, --mangle', 'mangle variable names')
  .option('--no-jsx', 'do not decompile JSX')
  .option('--no-unpack', 'do not extract modules from the bundle')
  .option('--no-deobfuscate', 'do not deobfuscate the code')
  .option('--no-unminify', 'do not unminify the code')
  .argument('[file]', 'input file, defaults to stdin')
  .action(async (input: string | undefined) => {
    const { output, force, ...options } = program.opts<Options>();
    const code = await (input ? readFile(input, 'utf8') : readStdin());

    if (output) {
      if (force || !existsSync(output)) {
        await rm(output, { recursive: true, force: true });
      } else {
        program.error('output directory already exists');
      }
    }

    const result = await webcrack(code, options);
    const { code: outputCode, bundle } = result;

    if (output) {
      const { mkdir, writeFile } = await import('fs/promises');
      const { join } = await import('path');

      await mkdir(output, { recursive: true });
      await writeFile(join(output, 'deobfuscated.js'), outputCode, 'utf8');

      if (bundle) {
        for (const [filename, content] of Object.entries(bundle.modules)) {
          const filepath = join(output, filename);
          await mkdir(join(filepath, '..'), { recursive: true });
          await writeFile(filepath, content, 'utf8');
        }
      }
    } else {
      console.log(outputCode);
      if (bundle) {
        debug('webcrack:unpack')(
          'Modules are not displayed in the terminal. Use the --output option to save them to a directory.',
        );
      }
    }
  })
  .parse();
