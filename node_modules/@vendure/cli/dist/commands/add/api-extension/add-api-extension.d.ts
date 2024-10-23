import { CliCommand, CliCommandReturnVal } from '../../../shared/cli-command';
import { ServiceRef } from '../../../shared/service-ref';
import { VendurePluginRef } from '../../../shared/vendure-plugin-ref';
export interface AddApiExtensionOptions {
    plugin?: VendurePluginRef;
}
export declare const addApiExtensionCommand: CliCommand<Record<string, any>, CliCommandReturnVal<{
    serviceRef: ServiceRef;
}>>;
