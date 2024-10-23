import { CliCommand, CliCommandReturnVal } from '../../../shared/cli-command';
import { EntityRef } from '../../../shared/entity-ref';
import { VendurePluginRef } from '../../../shared/vendure-plugin-ref';
export interface AddEntityOptions {
    plugin?: VendurePluginRef;
    className: string;
    fileName: string;
    translationFileName: string;
    features: {
        customFields: boolean;
        translatable: boolean;
    };
}
export declare const addEntityCommand: CliCommand<Record<string, any>, CliCommandReturnVal<{
    entityRef: EntityRef;
}>>;
export declare function getCustomEntityName(_cancelledMessage: string): Promise<string>;
