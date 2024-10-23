import { ClassDeclaration, Scope } from 'ts-morph';
import { EntityRef } from './entity-ref';
export interface ServiceFeatures {
    findOne: boolean;
    findAll: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
}
export declare class ServiceRef {
    readonly classDeclaration: ClassDeclaration;
    readonly features: ServiceFeatures;
    readonly crudEntityRef?: EntityRef;
    get name(): string;
    get nameCamelCase(): string;
    get isCrudService(): boolean;
    constructor(classDeclaration: ClassDeclaration);
    injectDependency(dependency: {
        scope?: Scope;
        name: string;
        type: string;
    }): void;
    private getEntityRef;
    private unwrapReturnType;
}
