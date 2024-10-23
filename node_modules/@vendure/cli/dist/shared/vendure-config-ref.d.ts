import { ObjectLiteralExpression, Project, SourceFile } from 'ts-morph';
export declare class VendureConfigRef {
    private project;
    readonly sourceFile: SourceFile;
    readonly configObject: ObjectLiteralExpression;
    constructor(project: Project, options?: {
        checkFileName?: boolean;
    });
    getPathRelativeToProjectRoot(): string;
    getConfigObjectVariableName(): string | undefined;
    getPluginsArray(): import("ts-morph").ArrayLiteralExpression | undefined;
    addToPluginsArray(text: string): void;
    private isVendureConfigVariableDeclaration;
}
