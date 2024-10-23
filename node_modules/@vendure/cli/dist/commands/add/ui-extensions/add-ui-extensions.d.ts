import { CliCommand, CliCommandReturnVal } from '../../../shared/cli-command';
import { VendurePluginRef } from '../../../shared/vendure-plugin-ref';
export interface AddUiExtensionsOptions {
    plugin?: VendurePluginRef;
}
export declare const addUiExtensionsCommand: CliCommand<AddUiExtensionsOptions, CliCommandReturnVal<Record<string, any>>>;
