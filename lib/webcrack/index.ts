import type { ParseResult } from '@babel/parser';
import { parse } from '@babel/parser';
import type * as t from '@babel/types';
import type Matchers from '@codemod/matchers';
import * as m from '@codemod/matchers';
import debug from 'debug';
import {
  applyTransform,
  applyTransformAsync,
  applyTransforms,
  generate,
} from './ast-utils';
import deobfuscate, {
  createBrowserSandbox,
  type Sandbox,
} from './deobfuscate';
import debugProtection from './deobfuscate/debug-protection';
import evaluateGlobals from './deobfuscate/evaluate-globals';
import mergeObjectAssignments from './deobfuscate/merge-object-assignments';
import selfDefending from './deobfuscate/self-defending';
import varFunctions from './deobfuscate/var-functions';
import {
  runPlugins,
  type Plugin,
  type PluginState,
  type Stage,
} from './plugin';
import jsx from './transforms/jsx';
import jsxNew from './transforms/jsx-new';
import mangle from './transforms/mangle';
import transpile from './transpile';
import unminify from './unminify';
import {
  blockStatements,
  sequence,
  splitVariableDeclarations,
} from './unminify/transforms';
import type { Bundle } from './unpack';
import { unpackAST } from './unpack';
import { isBrowser } from './utils/platform';

export { type Sandbox } from './deobfuscate';
export type { Plugin } from './plugin';

type Matchers = typeof m;

export interface WebcrackResult {
  code: string;
  bundle: Bundle | undefined;
}

export interface Options {
  jsx?: boolean;
  unpack?: boolean;
  deobfuscate?: boolean;
  unminify?: boolean;
  mangle?: boolean | ((id: string) => boolean);
  plugins?: Partial<Record<Stage, Plugin[]>>;
  mappings?: (m: Matchers) => Record<string, m.Matcher<unknown>>;
  sandbox?: Sandbox;
  onProgress?: (progress: number) => void;
}

function mergeOptions(options: Options): asserts options is Required<Options> {
  const mergedOptions: Required<Options> = {
    jsx: true,
    unminify: true,
    unpack: true,
    deobfuscate: true,
    mangle: false,
    plugins: options.plugins ?? {},
    mappings: () => ({}),
    onProgress: () => {},
    sandbox: isBrowser() ? createBrowserSandbox() : createLocalSandbox(),
    ...options,
  };
  Object.assign(options, mergedOptions);
}

export async function webcrack(
  code: string,
  options: Options = {},
): Promise<WebcrackResult> {
  mergeOptions(options);
  options.onProgress(0);

  if (isBrowser()) {
    debug.enable('webcrack:*');
  }

  const isBookmarklet = /^javascript:./.test(code);
  if (isBookmarklet) {
    code = code
      .replace(/^javascript:/, '')
      .split(/%(?![a-f\d]{2})/i)
      .map(decodeURIComponent)
      .join('%');
  }

  let ast: ParseResult<t.File> = null!;
  let outputCode = '';
  let bundle: Bundle | undefined;

  const { plugins } = options;
  const state: PluginState = { opts: {} };

  const stages = [
    () => {
      ast = parse(code, {
        sourceType: 'unambiguous',
        allowReturnOutsideFunction: true,
        errorRecovery: true,
        plugins: ['jsx'],
      });
      if (ast.errors?.length) {
        debug('webcrack:parse')('Recovered from parse errors', ast.errors);
      }
    },
    plugins.afterParse && (() => runPlugins(ast, plugins.afterParse!, state)),

    () => {
      applyTransforms(
        ast,
        [blockStatements, sequence, splitVariableDeclarations, varFunctions],
        { name: 'prepare' },
      );
    },
    plugins.afterPrepare &&
      (() => runPlugins(ast, plugins.afterPrepare!, state)),

    options.deobfuscate &&
      (() => applyTransformAsync(ast, deobfuscate, options.sandbox)),
    plugins.afterDeobfuscate &&
      (() => runPlugins(ast, plugins.afterDeobfuscate!, state)),

    options.unminify &&
      (() => {
        applyTransforms(ast, [transpile, unminify]);
      }),
    plugins.afterUnminify &&
      (() => runPlugins(ast, plugins.afterUnminify!, state)),

    options.mangle &&
      (() =>
        applyTransform(
          ast,
          mangle,
          typeof options.mangle === 'boolean' ? () => true : options.mangle,
        )),
    (options.deobfuscate || options.jsx) &&
      (() => {
        applyTransforms(
          ast,
          [
            options.deobfuscate ? [selfDefending, debugProtection] : [],
            options.jsx ? [jsx, jsxNew] : [],
          ].flat(),
        );
      }),
    options.deobfuscate &&
      (() => applyTransforms(ast, [mergeObjectAssignments, evaluateGlobals])),
    () => (outputCode = generate(ast)),
    options.unpack && (() => (bundle = unpackAST(ast, options.mappings(m)))),
    plugins.afterUnpack && (() => runPlugins(ast, plugins.afterUnpack!, state)),
  ].filter(Boolean) as (() => unknown)[];

  for (let i = 0; i < stages.length; i++) {
    await stages[i]();
    options.onProgress((100 / stages.length) * (i + 1));
  }

  return {
    code: outputCode,
    bundle,
    async save(savePath) {
      await bundle?.save(savePath);
    },
  };
}

export default deobfuscate;

export async function saveOnServer(savePath: string, outputCode: string) {
  const { normalize, join } = await import('path');
  const { mkdir, writeFile } = await import('fs/promises');

  const norm = normalize(savePath);
  await mkdir(norm, { recursive: true });
  await writeFile(join(norm, 'deobfuscated.js'), outputCode, 'utf8');
}
