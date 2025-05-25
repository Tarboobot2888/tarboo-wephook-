import { existsSync, readFileSync } from 'fs';
import { readFile, rm } from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import deobfuscate from './index';
import { saveOnServer } from './index';

const program = new Command();

program
  .name('webcrack')
  .description('Deobfuscate JavaScript using WebCrack')
  .version('1.0.0')
  .argument('<file>', 'Input JavaScript file')
  .option('-o, --output <dir>', 'Output directory')
  .action(async (file, options) => {
    const input = await readFile(file, 'utf8');

    const ast = parse(input, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    await deobfuscate.run(ast, { changes: 0 }, undefined);
    const { code } = generate(ast, { comments: false });

    if (options.output) {
      await saveOnServer(options.output, code);
    } else {
      console.log(code);
    }
  });

program.parse();
