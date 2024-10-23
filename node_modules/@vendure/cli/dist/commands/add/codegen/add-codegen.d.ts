import { CliCommand, CliCommandReturnVal } from '../../../shared/cli-command';
import { VendurePluginRef } from '../../../shared/vendure-plugin-ref';
export interface AddCodegenOptions {
    plugin?: VendurePluginRef;
}
export declare const addCodegenCommand: CliCommand<{
    plugin: VendurePluginRef;
}, CliCommandReturnVal>;
