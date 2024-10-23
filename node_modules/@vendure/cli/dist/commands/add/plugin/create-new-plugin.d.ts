import { Project, SourceFile } from 'ts-morph';
import { CliCommand, CliCommandReturnVal } from '../../../shared/cli-command';
import { VendurePluginRef } from '../../../shared/vendure-plugin-ref';
import { GeneratePluginOptions } from './types';
export declare const createNewPluginCommand: CliCommand<Record<string, any>, CliCommandReturnVal>;
export declare function createNewPlugin(): Promise<CliCommandReturnVal>;
export declare function generatePlugin(project: Project, options: GeneratePluginOptions): Promise<{
    plugin: VendurePluginRef;
    modifiedSourceFiles: SourceFile[];
}>;
