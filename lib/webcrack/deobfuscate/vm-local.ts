// lib/webcrack/deobfuscate/vm-local.ts
import type { NodePath } from '@babel/traverse';
import type { CallExpression } from '@babel/types';
import debug from 'debug';
import { generate } from '../ast-utils';
import type { ArrayRotator } from './array-rotator';
import type { Decoder } from './decoder';
import type { StringArray } from './string-array';

export type Sandbox = (code: string) => Promise<unknown>;

export function createNodeSandbox(): Sandbox {
  return async (code: string) => {
    try {
      // مخصص للعمل في Vercel بدون vm2
      return Function(`"use strict"; return (${code})`)();
    } catch (err) {
      throw new Error('Local sandbox execution failed', { cause: err });
    }
  };
}

export function createBrowserSandbox(): Sandbox {
  return () => {
    throw new Error('Custom Sandbox implementation required in browser.');
  };
}

export class VMDecoder {
  decoders: Decoder[];
  private setupCode: string;
  private sandbox: Sandbox;

  constructor(
    sandbox: Sandbox,
    stringArray: StringArray,
    decoders: Decoder[],
    rotator?: ArrayRotator,
  ) {
    this.sandbox = sandbox;
    this.decoders = decoders;

    const generateOptions = {
      compact: true,
      shouldPrintComment: () => false,
    };

    const stringArrayCode = generate(stringArray.path.node, generateOptions);
    const rotatorCode = rotator ? generate(rotator.node, generateOptions) : '';
    const decoderCode = decoders
      .map((decoder) => generate(decoder.path.node, generateOptions))
      .join(';\n');

    this.setupCode = [stringArrayCode, rotatorCode, decoderCode].join(';\n');
  }

  async decode(calls: NodePath<CallExpression>[]): Promise<unknown[]> {
    const callExpressions = calls.map((call) => generate(call.node)).join(',');
    const code = `(() => {
      ${this.setupCode}
      return [${callExpressions}]
    })()`;

    try {
      const result = await this.sandbox(code);
      return result as unknown[];
    } catch (error) {
      debug('webcrack:deobfuscate')('vm code:', code);
      throw error;
    }
  }
}
export { createNodeSandbox as createLocalSandbox };
