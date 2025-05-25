import { existsSync, readFileSync } from 'fs';
import { readFile, rm } from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import deobfuscate from './index';

const program = new Command();

program
  .name('webcrack')
  .description('Deobfuscate JavaScript using WebCrack')
  .version('0.0.1')
  .argument('<file>', 'Input JavaScript file')
  .option('-o, --output <dir>', 'Output directory')
  .action(async (file, options) => {
    const input = await readFile(file, 'utf8');
    const ast = deobfuscate.parse(input);
    await deobfuscate.run(ast);
    const code = deobfuscate.generate(ast);
    if (options.output) {
      await deobfuscate.saveOnServer(options.output, code);
    } else {
      console.log(code);
    }
  });

program.parse();
