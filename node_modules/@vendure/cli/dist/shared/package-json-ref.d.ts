import { Project } from 'ts-morph';
export interface PackageToInstall {
    pkg: string;
    version?: string;
    isDevDependency?: boolean;
    installInRoot?: boolean;
}
export declare class PackageJson {
    private readonly project;
    private _vendurePackageJsonPath;
    private _rootPackageJsonPath;
    constructor(project: Project);
    get vendurePackageJsonPath(): string | null;
    get rootPackageJsonPath(): string | null;
    determineVendureVersion(): string | undefined;
    installPackages(requiredPackages: PackageToInstall[]): Promise<void>;
    getPackageJsonContent(): any;
    determinePackageManager(): 'yarn' | 'npm' | 'pnpm';
    addScript(scriptName: string, script: string): void;
    getPackageRootDir(): import("ts-morph").Directory;
    locateRootPackageJson(): string | null;
    locatePackageJsonWithVendureDependency(): string | null;
    private hasVendureDependency;
    private runPackageManagerInstall;
}
