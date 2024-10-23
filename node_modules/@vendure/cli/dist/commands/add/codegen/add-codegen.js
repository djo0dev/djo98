"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCodegenCommand = void 0;
const prompts_1 = require("@clack/prompts");
const path_1 = __importDefault(require("path"));
const ts_morph_1 = require("ts-morph");
const cli_command_1 = require("../../../shared/cli-command");
const package_json_ref_1 = require("../../../shared/package-json-ref");
const shared_prompts_1 = require("../../../shared/shared-prompts");
const ast_utils_1 = require("../../../utilities/ast-utils");
const utils_1 = require("../../../utilities/utils");
const codegen_config_ref_1 = require("./codegen-config-ref");
exports.addCodegenCommand = new cli_command_1.CliCommand({
    id: 'add-codegen',
    category: 'Project: Codegen',
    description: 'Set up GraphQL code generation',
    run: addCodegen,
});
async function addCodegen(options) {
    const providedVendurePlugin = options === null || options === void 0 ? void 0 : options.plugin;
    const { project } = await (0, shared_prompts_1.analyzeProject)({
        providedVendurePlugin,
        cancelledMessage: 'Add codegen cancelled',
    });
    const plugins = providedVendurePlugin
        ? [providedVendurePlugin]
        : await (0, shared_prompts_1.selectMultiplePluginClasses)(project, 'Add codegen cancelled');
    const packageJson = new package_json_ref_1.PackageJson(project);
    const installSpinner = (0, prompts_1.spinner)();
    installSpinner.start(`Installing dependencies...`);
    const packagesToInstall = [
        {
            pkg: '@graphql-codegen/cli',
            isDevDependency: true,
        },
        {
            pkg: '@graphql-codegen/typescript',
            isDevDependency: true,
        },
    ];
    if (plugins.some(p => p.hasUiExtensions())) {
        packagesToInstall.push({
            pkg: '@graphql-codegen/client-preset',
            isDevDependency: true,
        });
    }
    const packageManager = packageJson.determinePackageManager();
    const packageJsonFile = packageJson.locatePackageJsonWithVendureDependency();
    prompts_1.log.info(`Detected package manager: ${packageManager}`);
    if (!packageJsonFile) {
        (0, prompts_1.cancel)(`Could not locate package.json file with a dependency on Vendure.`);
        process.exit(1);
    }
    prompts_1.log.info(`Detected package.json: ${packageJsonFile}`);
    try {
        await packageJson.installPackages(packagesToInstall);
    }
    catch (e) {
        prompts_1.log.error(`Failed to install dependencies: ${e.message}.`);
    }
    installSpinner.stop('Dependencies installed');
    const configSpinner = (0, prompts_1.spinner)();
    configSpinner.start('Configuring codegen file...');
    await (0, utils_1.pauseForPromptDisplay)();
    const codegenFile = new codegen_config_ref_1.CodegenConfigRef(project, packageJson.getPackageRootDir());
    const rootDir = project.getDirectory('.');
    if (!rootDir) {
        throw new Error('Could not find the root directory of the project');
    }
    for (const plugin of plugins) {
        const relativePluginPath = (0, ast_utils_1.getRelativeImportPath)({
            from: rootDir,
            to: plugin.classDeclaration.getSourceFile(),
        });
        const generatedTypesPath = `${path_1.default.dirname(relativePluginPath)}/gql/generated.ts`;
        codegenFile.addEntryToGeneratesObject({
            name: `'${generatedTypesPath}'`,
            kind: ts_morph_1.StructureKind.PropertyAssignment,
            initializer: `{ plugins: ['typescript'] }`,
        });
        if (plugin.hasUiExtensions()) {
            const uiExtensionsPath = `${path_1.default.dirname(relativePluginPath)}/ui`;
            codegenFile.addEntryToGeneratesObject({
                name: `'${uiExtensionsPath}/gql/'`,
                kind: ts_morph_1.StructureKind.PropertyAssignment,
                initializer: `{
                        preset: 'client',
                        documents: '${uiExtensionsPath}/**/*.ts',
                        presetConfig: {
                            fragmentMasking: false,
                        },
                     }`,
            });
        }
    }
    packageJson.addScript('codegen', 'graphql-codegen --config codegen.ts');
    configSpinner.stop('Configured codegen file');
    await project.save();
    const nextSteps = [
        `You can run codegen by doing the following:`,
        `1. Ensure your dev server is running`,
        `2. Run "npm run codegen"`,
    ];
    (0, prompts_1.note)(nextSteps.join('\n'));
    return {
        project,
        modifiedSourceFiles: [codegenFile.sourceFile],
    };
}
//# sourceMappingURL=add-codegen.js.map