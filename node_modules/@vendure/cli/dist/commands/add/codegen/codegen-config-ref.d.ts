import { Directory, ObjectLiteralExpression, Project, PropertyAssignmentStructure, SourceFile } from 'ts-morph';
export declare class CodegenConfigRef {
    private readonly project;
    readonly sourceFile: SourceFile;
    private configObject;
    constructor(project: Project, rootDir: Directory);
    addEntryToGeneratesObject(structure: PropertyAssignmentStructure): void;
    getConfigObject(): ObjectLiteralExpression;
    save(): Promise<void>;
}
