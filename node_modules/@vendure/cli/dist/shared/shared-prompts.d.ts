import { Project } from 'ts-morph';
import { EntityRef } from './entity-ref';
import { ServiceRef } from './service-ref';
import { VendurePluginRef } from './vendure-plugin-ref';
export declare function analyzeProject(options: {
    providedVendurePlugin?: VendurePluginRef;
    cancelledMessage?: string;
}): Promise<{
    project: Project;
    tsConfigPath: string | undefined;
}>;
export declare function selectPlugin(project: Project, cancelledMessage: string): Promise<VendurePluginRef>;
export declare function selectEntity(plugin: VendurePluginRef): Promise<EntityRef>;
export declare function selectMultiplePluginClasses(project: Project, cancelledMessage: string): Promise<VendurePluginRef[]>;
export declare function selectServiceRef(project: Project, plugin: VendurePluginRef, canCreateNew?: boolean): Promise<ServiceRef>;
export declare function getServices(project: Project): ServiceRef[];
