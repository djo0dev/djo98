import { ClassDeclaration, InterfaceDeclaration, VariableDeclaration } from 'ts-morph';
import { EntityRef } from './entity-ref';
export declare class VendurePluginRef {
    classDeclaration: ClassDeclaration;
    constructor(classDeclaration: ClassDeclaration);
    get name(): string;
    getSourceFile(): import("ts-morph").SourceFile;
    getPluginDir(): import("ts-morph").Directory;
    getMetadataOptions(): import("ts-morph").ObjectLiteralExpression;
    getPluginOptions(): {
        typeDeclaration: InterfaceDeclaration;
        constantDeclaration: VariableDeclaration;
    } | undefined;
    addEntity(entityClassName: string): void;
    addProvider(providerClassName: string): void;
    addAdminApiExtensions(extension: {
        schema: VariableDeclaration | undefined;
        resolvers: ClassDeclaration[];
    }): void;
    getEntities(): EntityRef[];
    hasUiExtensions(): boolean;
}
