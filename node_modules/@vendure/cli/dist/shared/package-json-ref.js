"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageJson = void 0;
const prompts_1 = require("@clack/prompts");
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class PackageJson {
    constructor(project) {
        this.project = project;
    }
    get vendurePackageJsonPath() {
        return this.locatePackageJsonWithVendureDependency();
    }
    get rootPackageJsonPath() {
        return this.locateRootPackageJson();
    }
    determineVendureVersion() {
        const packageJson = this.getPackageJsonContent();
        return packageJson.dependencies['@vendure/core'];
    }
    async installPackages(requiredPackages) {
        const packageJson = this.getPackageJsonContent();
        const packagesToInstall = requiredPackages.filter(({ pkg, version, isDevDependency }) => {
            const hasDependency = isDevDependency
                ? packageJson.devDependencies[pkg]
                : packageJson.dependencies[pkg];
            return !hasDependency;
        });
        const depsToInstall = packagesToInstall
            .filter(p => { var _a; return !p.isDevDependency && ((_a = packageJson.dependencies) === null || _a === void 0 ? void 0 : _a[p.pkg]) === undefined; })
            .map(p => `${p.pkg}${p.version ? `@${p.version}` : ''}`);
        const devDepsToInstall = packagesToInstall
            .filter(p => { var _a; return p.isDevDependency && ((_a = packageJson.devDependencies) === null || _a === void 0 ? void 0 : _a[p.pkg]) === undefined; })
            .map(p => `${p.pkg}${p.version ? `@${p.version}` : ''}`);
        if (depsToInstall.length) {
            await this.runPackageManagerInstall(depsToInstall, false);
        }
        if (devDepsToInstall.length) {
            await this.runPackageManagerInstall(devDepsToInstall, true);
        }
    }
    getPackageJsonContent() {
        const packageJsonPath = this.locatePackageJsonWithVendureDependency();
        if (!packageJsonPath || !fs_extra_1.default.existsSync(packageJsonPath)) {
            (0, prompts_1.note)(`Could not find a package.json in the current directory. Please run this command from the root of a Vendure project.`);
            return false;
        }
        return fs_extra_1.default.readJsonSync(packageJsonPath);
    }
    determinePackageManager() {
        const rootDir = this.getPackageRootDir().getPath();
        const yarnLockPath = path_1.default.join(rootDir, 'yarn.lock');
        const npmLockPath = path_1.default.join(rootDir, 'package-lock.json');
        const pnpmLockPath = path_1.default.join(rootDir, 'pnpm-lock.yaml');
        if (fs_extra_1.default.existsSync(yarnLockPath)) {
            return 'yarn';
        }
        if (fs_extra_1.default.existsSync(npmLockPath)) {
            return 'npm';
        }
        if (fs_extra_1.default.existsSync(pnpmLockPath)) {
            return 'pnpm';
        }
        return 'npm';
    }
    addScript(scriptName, script) {
        const packageJson = this.getPackageJsonContent();
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts[scriptName] = script;
        const packageJsonPath = this.vendurePackageJsonPath;
        if (packageJsonPath) {
            fs_extra_1.default.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
        }
    }
    getPackageRootDir() {
        const rootDir = this.project.getDirectory('.');
        if (!rootDir) {
            throw new Error('Could not find the root directory of the project');
        }
        return rootDir;
    }
    locateRootPackageJson() {
        if (this._rootPackageJsonPath) {
            return this._rootPackageJsonPath;
        }
        const rootDir = this.getPackageRootDir().getPath();
        const rootPackageJsonPath = path_1.default.join(rootDir, 'package.json');
        if (fs_extra_1.default.existsSync(rootPackageJsonPath)) {
            this._rootPackageJsonPath = rootPackageJsonPath;
            return rootPackageJsonPath;
        }
        return null;
    }
    locatePackageJsonWithVendureDependency() {
        if (this._vendurePackageJsonPath) {
            return this._vendurePackageJsonPath;
        }
        const rootDir = this.getPackageRootDir().getPath();
        const potentialMonorepoDirs = ['packages', 'apps', 'libs'];
        const rootPackageJsonPath = path_1.default.join(this.getPackageRootDir().getPath(), 'package.json');
        if (this.hasVendureDependency(rootPackageJsonPath)) {
            return rootPackageJsonPath;
        }
        for (const dir of potentialMonorepoDirs) {
            const monorepoDir = path_1.default.join(rootDir, dir);
            for (const subDir of fs_extra_1.default.readdirSync(monorepoDir)) {
                const packageJsonPath = path_1.default.join(monorepoDir, subDir, 'package.json');
                if (this.hasVendureDependency(packageJsonPath)) {
                    this._vendurePackageJsonPath = packageJsonPath;
                    return packageJsonPath;
                }
            }
        }
        return null;
    }
    hasVendureDependency(packageJsonPath) {
        var _a;
        if (!fs_extra_1.default.existsSync(packageJsonPath)) {
            return false;
        }
        const packageJson = fs_extra_1.default.readJsonSync(packageJsonPath);
        return !!((_a = packageJson.dependencies) === null || _a === void 0 ? void 0 : _a['@vendure/core']);
    }
    async runPackageManagerInstall(dependencies, isDev) {
        return new Promise((resolve, reject) => {
            const packageManager = this.determinePackageManager();
            let command = '';
            let args = [];
            if (packageManager === 'yarn') {
                command = 'yarnpkg';
                args = ['add', '--exact', '--ignore-engines'];
                if (isDev) {
                    args.push('--dev');
                }
                args = args.concat(dependencies);
            }
            else if (packageManager === 'pnpm') {
                command = 'pnpm';
                args = ['add', '--save-exact'].concat(dependencies);
                if (isDev) {
                    args.push('--save-dev', '--workspace-root');
                }
            }
            else {
                command = 'npm';
                args = ['install', '--save', '--save-exact', '--loglevel', 'error'].concat(dependencies);
                if (isDev) {
                    args.push('--save-dev');
                }
            }
            const child = (0, cross_spawn_1.default)(command, args, { stdio: 'ignore' });
            child.on('close', code => {
                if (code !== 0) {
                    const message = 'An error occurred when installing dependencies.';
                    reject({
                        message,
                        command: `${command} ${args.join(' ')}`,
                    });
                    return;
                }
                resolve();
            });
        });
    }
}
exports.PackageJson = PackageJson;
//# sourceMappingURL=package-json-ref.js.map