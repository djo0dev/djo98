import { CliCommand, CliCommandReturnVal } from '../../../shared/cli-command';
import { ServiceRef } from '../../../shared/service-ref';
export declare const addServiceCommand: CliCommand<Record<string, any>, CliCommandReturnVal<{
    serviceRef: ServiceRef;
}>>;
