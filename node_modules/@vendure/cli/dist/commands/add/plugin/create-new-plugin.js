"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlugin = exports.createNewPlugin = exports.createNewPluginCommand = void 0;
const prompts_1 = require("@clack/prompts");
const change_case_1 = require("change-case");
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const cli_command_1 = require("../../../shared/cli-command");
const shared_prompts_1 = require("../../../shared/shared-prompts");
const vendure_config_ref_1 = require("../../../shared/vendure-config-ref");
const vendure_plugin_ref_1 = require("../../../shared/vendure-plugin-ref");
const ast_utils_1 = require("../../../utilities/ast-utils");
const utils_1 = require("../../../utilities/utils");
const add_api_extension_1 = require("../api-extension/add-api-extension");
const add_codegen_1 = require("../codegen/add-codegen");
const add_entity_1 = require("../entity/add-entity");
const add_job_queue_1 = require("../job-queue/add-job-queue");
const add_service_1 = require("../service/add-service");
const add_ui_extensions_1 = require("../ui-extensions/add-ui-extensions");
exports.createNewPluginCommand = new cli_command_1.CliCommand({
    id: 'create-new-plugin',
    category: 'Plugin',
    description: 'Create a new Vendure plugin',
    run: createNewPlugin,
});
const cancelledMessage = 'Plugin setup cancelled.';
async function createNewPlugin() {
    const options = { name: '', customEntityName: '', pluginDir: '' };
    (0, prompts_1.intro)('Adding a new Vendure plugin!');
    const { project } = await (0, shared_prompts_1.analyzeProject)({ cancelledMessage });
    if (!options.name) {
        const name = await (0, prompts_1.text)({
            message: 'What is the name of the plugin?',
            initialValue: 'my-new-feature',
            validate: input => {
                if (!/^[a-z][a-z-0-9]+$/.test(input)) {
                    return 'The plugin name must be lowercase and contain only letters, numbers and dashes';
                }
            },
        });
        if ((0, prompts_1.isCancel)(name)) {
            (0, prompts_1.cancel)(cancelledMessage);
            process.exit(0);
        }
        else {
            options.name = name;
        }
    }
    const existingPluginDir = findExistingPluginsDir(project);
    const pluginDir = getPluginDirName(options.name, existingPluginDir);
    const confirmation = await (0, prompts_1.text)({
        message: 'Plugin location',
        initialValue: pluginDir,
        placeholder: '',
        validate: input => {
            if (fs.existsSync(input)) {
                return `A directory named "${input}" already exists. Please specify a different directory.`;
            }
        },
    });
    if ((0, prompts_1.isCancel)(confirmation)) {
        (0, prompts_1.cancel)(cancelledMessage);
        process.exit(0);
    }
    options.pluginDir = confirmation;
    const { plugin, modifiedSourceFiles } = await generatePlugin(project, options);
    const configSpinner = (0, prompts_1.spinner)();
    configSpinner.start('Updating VendureConfig...');
    await (0, utils_1.pauseForPromptDisplay)();
    const vendureConfig = new vendure_config_ref_1.VendureConfigRef(project);
    vendureConfig.addToPluginsArray(`${plugin.name}.init({})`);
    (0, ast_utils_1.addImportsToFile)(vendureConfig.sourceFile, {
        moduleSpecifier: plugin.getSourceFile(),
        namedImports: [plugin.name],
    });
    await vendureConfig.sourceFile.getProject().save();
    configSpinner.stop('Updated VendureConfig');
    let done = false;
    const followUpCommands = [
        add_entity_1.addEntityCommand,
        add_service_1.addServiceCommand,
        add_api_extension_1.addApiExtensionCommand,
        add_job_queue_1.addJobQueueCommand,
        add_ui_extensions_1.addUiExtensionsCommand,
        add_codegen_1.addCodegenCommand,
    ];
    let allModifiedSourceFiles = [...modifiedSourceFiles];
    while (!done) {
        const featureType = await (0, prompts_1.select)({
            message: `Add features to ${options.name}?`,
            options: [
                { value: 'no', label: "[Finish] No, I'm done!" },
                ...followUpCommands.map(c => ({
                    value: c.id,
                    label: `[${c.category}] ${c.description}`,
                })),
            ],
        });
        if ((0, prompts_1.isCancel)(featureType)) {
            done = true;
        }
        if (featureType === 'no') {
            done = true;
        }
        else {
            const command = followUpCommands.find(c => c.id === featureType);
            try {
                const result = await command.run({ plugin });
                allModifiedSourceFiles = result.modifiedSourceFiles;
                for (const sourceFile of allModifiedSourceFiles) {
                    sourceFile.organizeImports();
                }
            }
            catch (e) {
                prompts_1.log.error(`Error adding feature "${command.id}"`);
                prompts_1.log.error(e.stack);
            }
        }
    }
    return {
        project,
        modifiedSourceFiles: [],
    };
}
exports.createNewPlugin = createNewPlugin;
async function generatePlugin(project, options) {
    var _a, _b, _c, _d;
    const nameWithoutPlugin = options.name.replace(/-?plugin$/i, '');
    const normalizedName = nameWithoutPlugin + '-plugin';
    const templateContext = Object.assign(Object.assign({}, options), { pluginName: (0, change_case_1.pascalCase)(normalizedName), pluginInitOptionsName: (0, change_case_1.constantCase)(normalizedName) + '_OPTIONS' });
    const projectSpinner = (0, prompts_1.spinner)();
    projectSpinner.start('Generating plugin scaffold...');
    await (0, utils_1.pauseForPromptDisplay)();
    const pluginFile = (0, ast_utils_1.createFile)(project, path_1.default.join(__dirname, 'templates/plugin.template.ts'), path_1.default.join(options.pluginDir, (0, change_case_1.paramCase)(nameWithoutPlugin) + '.plugin.ts'));
    const pluginClass = pluginFile.getClass('TemplatePlugin');
    if (!pluginClass) {
        throw new Error('Could not find the plugin class in the generated file');
    }
    (_a = pluginFile.getImportDeclaration('./constants.template')) === null || _a === void 0 ? void 0 : _a.setModuleSpecifier('./constants');
    (_b = pluginFile.getImportDeclaration('./types.template')) === null || _b === void 0 ? void 0 : _b.setModuleSpecifier('./types');
    pluginClass.rename(templateContext.pluginName);
    const typesFile = (0, ast_utils_1.createFile)(project, path_1.default.join(__dirname, 'templates/types.template.ts'), path_1.default.join(options.pluginDir, 'types.ts'));
    const constantsFile = (0, ast_utils_1.createFile)(project, path_1.default.join(__dirname, 'templates/constants.template.ts'), path_1.default.join(options.pluginDir, 'constants.ts'));
    (_c = constantsFile
        .getVariableDeclaration('TEMPLATE_PLUGIN_OPTIONS')) === null || _c === void 0 ? void 0 : _c.rename(templateContext.pluginInitOptionsName).set({ initializer: `Symbol('${templateContext.pluginInitOptionsName}')` });
    (_d = constantsFile
        .getVariableDeclaration('loggerCtx')) === null || _d === void 0 ? void 0 : _d.set({ initializer: `'${templateContext.pluginName}'` });
    projectSpinner.stop('Generated plugin scaffold');
    await project.save();
    return {
        modifiedSourceFiles: [pluginFile, typesFile, constantsFile],
        plugin: new vendure_plugin_ref_1.VendurePluginRef(pluginClass),
    };
}
exports.generatePlugin = generatePlugin;
function findExistingPluginsDir(project) {
    const pluginClasses = (0, ast_utils_1.getPluginClasses)(project);
    if (pluginClasses.length === 0) {
        return;
    }
    if (pluginClasses.length === 1) {
        return { prefix: path_1.default.dirname(pluginClasses[0].getSourceFile().getDirectoryPath()), suffix: '' };
    }
    const pluginDirs = pluginClasses.map(c => {
        return c.getSourceFile().getDirectoryPath();
    });
    const prefix = findCommonPath(pluginDirs);
    const suffixStartIndex = prefix.length;
    const rest = pluginDirs[0].substring(suffixStartIndex).replace(/^\//, '').split('/');
    const suffix = rest.length > 1 ? rest.slice(1).join('/') : '';
    return { prefix, suffix };
}
function getPluginDirName(name, existingPluginDirPattern) {
    const cwd = process.cwd();
    const nameWithoutPlugin = name.replace(/-?plugin$/i, '');
    if (existingPluginDirPattern) {
        return path_1.default.join(existingPluginDirPattern.prefix, (0, change_case_1.paramCase)(nameWithoutPlugin), existingPluginDirPattern.suffix);
    }
    else {
        return path_1.default.join(cwd, 'src', 'plugins', (0, change_case_1.paramCase)(nameWithoutPlugin));
    }
}
function findCommonPath(paths) {
    if (paths.length === 0) {
        return '';
    }
    const pathSegmentsList = paths.map(p => p.split('/'));
    const minLength = Math.min(...pathSegmentsList.map(segments => segments.length));
    const commonPath = [];
    for (let i = 0; i < minLength; i++) {
        const currentSegment = pathSegmentsList[0][i];
        const isCommon = pathSegmentsList.every(segments => segments[i] === currentSegment);
        if (isCommon) {
            commonPath.push(currentSegment);
        }
        else {
            break;
        }
    }
    return commonPath.join('/');
}
//# sourceMappingURL=create-new-plugin.js.map