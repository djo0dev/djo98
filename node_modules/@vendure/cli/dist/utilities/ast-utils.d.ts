import { Directory, Project, ProjectOptions, SourceFile } from 'ts-morph';
import { EntityRef } from '../shared/entity-ref';
export declare function selectTsConfigFile(): Promise<string>;
export declare function getTsMorphProject(options?: ProjectOptions, providedTsConfigPath?: string): Promise<{
    project: Project;
    tsConfigPath: string;
}>;
export declare function getPluginClasses(project: Project): import("ts-morph").ClassDeclaration[];
export declare function addImportsToFile(sourceFile: SourceFile, options: {
    moduleSpecifier: string | SourceFile;
    namedImports?: string[];
    namespaceImport?: string;
    order?: number;
}): void;
export declare function getRelativeImportPath(locations: {
    from: SourceFile | Directory;
    to: SourceFile | Directory;
}): string;
export declare function createFile(project: Project, templatePath: string, filePath: string): SourceFile;
export declare function customizeCreateUpdateInputInterfaces(sourceFile: SourceFile, entityRef: EntityRef): void;
