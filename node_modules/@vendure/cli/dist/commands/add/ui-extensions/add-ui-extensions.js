"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUiExtensionsCommand = void 0;
const prompts_1 = require("@clack/prompts");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const cli_command_1 = require("../../../shared/cli-command");
const package_json_ref_1 = require("../../../shared/package-json-ref");
const shared_prompts_1 = require("../../../shared/shared-prompts");
const vendure_config_ref_1 = require("../../../shared/vendure-config-ref");
const ast_utils_1 = require("../../../utilities/ast-utils");
const add_ui_extension_static_prop_1 = require("./codemods/add-ui-extension-static-prop/add-ui-extension-static-prop");
const update_admin_ui_plugin_init_1 = require("./codemods/update-admin-ui-plugin-init/update-admin-ui-plugin-init");
exports.addUiExtensionsCommand = new cli_command_1.CliCommand({
    id: 'add-ui-extensions',
    category: 'Plugin: UI',
    description: 'Set up Admin UI extensions',
    run: options => addUiExtensions(options),
});
async function addUiExtensions(options) {
    const providedVendurePlugin = options === null || options === void 0 ? void 0 : options.plugin;
    const { project } = await (0, shared_prompts_1.analyzeProject)({ providedVendurePlugin });
    const vendurePlugin = providedVendurePlugin !== null && providedVendurePlugin !== void 0 ? providedVendurePlugin : (await (0, shared_prompts_1.selectPlugin)(project, 'Add UI extensions cancelled'));
    const packageJson = new package_json_ref_1.PackageJson(project);
    if (vendurePlugin.hasUiExtensions()) {
        (0, prompts_1.outro)('This plugin already has UI extensions configured');
        return { project, modifiedSourceFiles: [] };
    }
    (0, add_ui_extension_static_prop_1.addUiExtensionStaticProp)(vendurePlugin);
    prompts_1.log.success('Updated the plugin class');
    const installSpinner = (0, prompts_1.spinner)();
    const packageManager = packageJson.determinePackageManager();
    const packageJsonFile = packageJson.locatePackageJsonWithVendureDependency();
    prompts_1.log.info(`Detected package manager: ${packageManager}`);
    if (!packageJsonFile) {
        (0, prompts_1.cancel)(`Could not locate package.json file with a dependency on Vendure.`);
        process.exit(1);
    }
    prompts_1.log.info(`Detected package.json: ${packageJsonFile}`);
    installSpinner.start(`Installing dependencies using ${packageManager}...`);
    try {
        const version = packageJson.determineVendureVersion();
        await packageJson.installPackages([
            {
                pkg: '@vendure/ui-devkit',
                isDevDependency: true,
                version,
            },
            {
                pkg: '@types/react',
                isDevDependency: true,
            },
        ]);
    }
    catch (e) {
        prompts_1.log.error(`Failed to install dependencies: ${e.message}.`);
    }
    installSpinner.stop('Dependencies installed');
    const pluginDir = vendurePlugin.getPluginDir().getPath();
    const providersFileDest = path_1.default.join(pluginDir, 'ui', 'providers.ts');
    if (!fs_extra_1.default.existsSync(providersFileDest)) {
        (0, ast_utils_1.createFile)(project, path_1.default.join(__dirname, 'templates/providers.template.ts'), providersFileDest);
    }
    const routesFileDest = path_1.default.join(pluginDir, 'ui', 'routes.ts');
    if (!fs_extra_1.default.existsSync(routesFileDest)) {
        (0, ast_utils_1.createFile)(project, path_1.default.join(__dirname, 'templates/routes.template.ts'), routesFileDest);
    }
    prompts_1.log.success('Created UI extension scaffold');
    const vendureConfig = new vendure_config_ref_1.VendureConfigRef(project);
    if (!vendureConfig) {
        prompts_1.log.warning(`Could not find the VendureConfig declaration in your project. You will need to manually set up the compileUiExtensions function.`);
    }
    else {
        const pluginClassName = vendurePlugin.name;
        const pluginPath = (0, ast_utils_1.getRelativeImportPath)({
            to: vendurePlugin.classDeclaration.getSourceFile(),
            from: vendureConfig.sourceFile,
        });
        const updated = (0, update_admin_ui_plugin_init_1.updateAdminUiPluginInit)(vendureConfig, { pluginClassName, pluginPath });
        if (updated) {
            prompts_1.log.success('Updated VendureConfig file');
        }
        else {
            prompts_1.log.warning(`Could not update \`AdminUiPlugin.init()\` options.`);
            (0, prompts_1.note)(`You will need to manually set up the compileUiExtensions function,\nadding ` +
                `the \`${pluginClassName}.ui\` object to the \`extensions\` array.`, 'Info');
        }
    }
    await project.save();
    return { project, modifiedSourceFiles: [vendurePlugin.classDeclaration.getSourceFile()] };
}
//# sourceMappingURL=add-ui-extensions.js.map