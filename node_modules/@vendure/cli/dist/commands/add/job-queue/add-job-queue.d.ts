import { CliCommand, CliCommandReturnVal } from '../../../shared/cli-command';
import { ServiceRef } from '../../../shared/service-ref';
import { VendurePluginRef } from '../../../shared/vendure-plugin-ref';
export interface AddJobQueueOptions {
    plugin?: VendurePluginRef;
}
export declare const addJobQueueCommand: CliCommand<Record<string, any>, CliCommandReturnVal<{
    serviceRef: ServiceRef;
}>>;
