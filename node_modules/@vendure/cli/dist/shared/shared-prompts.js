"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServices = exports.selectServiceRef = exports.selectMultiplePluginClasses = exports.selectEntity = exports.selectPlugin = exports.analyzeProject = void 0;
const prompts_1 = require("@clack/prompts");
const add_service_1 = require("../commands/add/service/add-service");
const constants_1 = require("../constants");
const ast_utils_1 = require("../utilities/ast-utils");
const utils_1 = require("../utilities/utils");
const service_ref_1 = require("./service-ref");
const vendure_plugin_ref_1 = require("./vendure-plugin-ref");
async function analyzeProject(options) {
    const providedVendurePlugin = options.providedVendurePlugin;
    let project = providedVendurePlugin === null || providedVendurePlugin === void 0 ? void 0 : providedVendurePlugin.classDeclaration.getProject();
    let tsConfigPath;
    if (!providedVendurePlugin) {
        const projectSpinner = (0, prompts_1.spinner)();
        const tsConfigFile = await (0, ast_utils_1.selectTsConfigFile)();
        projectSpinner.start('Analyzing project...');
        await (0, utils_1.pauseForPromptDisplay)();
        const { project: _project, tsConfigPath: _tsConfigPath } = await (0, ast_utils_1.getTsMorphProject)({}, tsConfigFile);
        project = _project;
        tsConfigPath = _tsConfigPath;
        projectSpinner.stop('Project analyzed');
    }
    return { project: project, tsConfigPath };
}
exports.analyzeProject = analyzeProject;
async function selectPlugin(project, cancelledMessage) {
    const pluginClasses = (0, ast_utils_1.getPluginClasses)(project);
    if (pluginClasses.length === 0) {
        (0, prompts_1.cancel)(constants_1.Messages.NoPluginsFound);
        process.exit(0);
    }
    const targetPlugin = await (0, prompts_1.select)({
        message: 'To which plugin would you like to add the feature?',
        options: pluginClasses.map(c => ({
            value: c,
            label: c.getName(),
        })),
        maxItems: 10,
    });
    if ((0, prompts_1.isCancel)(targetPlugin)) {
        (0, prompts_1.cancel)(cancelledMessage);
        process.exit(0);
    }
    return new vendure_plugin_ref_1.VendurePluginRef(targetPlugin);
}
exports.selectPlugin = selectPlugin;
async function selectEntity(plugin) {
    const entities = plugin.getEntities();
    if (entities.length === 0) {
        throw new Error(constants_1.Messages.NoEntitiesFound);
    }
    const targetEntity = await (0, prompts_1.select)({
        message: 'Select an entity',
        options: entities
            .filter(e => !e.isTranslation())
            .map(e => ({
            value: e,
            label: e.name,
        })),
        maxItems: 10,
    });
    if ((0, prompts_1.isCancel)(targetEntity)) {
        (0, prompts_1.cancel)('Cancelled');
        process.exit(0);
    }
    return targetEntity;
}
exports.selectEntity = selectEntity;
async function selectMultiplePluginClasses(project, cancelledMessage) {
    const pluginClasses = (0, ast_utils_1.getPluginClasses)(project);
    if (pluginClasses.length === 0) {
        (0, prompts_1.cancel)(constants_1.Messages.NoPluginsFound);
        process.exit(0);
    }
    const selectAll = await (0, prompts_1.select)({
        message: 'To which plugin would you like to add the feature?',
        options: [
            {
                value: 'all',
                label: 'All plugins',
            },
            {
                value: 'specific',
                label: 'Specific plugins (you will be prompted to select the plugins)',
            },
        ],
    });
    if ((0, prompts_1.isCancel)(selectAll)) {
        (0, prompts_1.cancel)(cancelledMessage);
        process.exit(0);
    }
    if (selectAll === 'all') {
        return pluginClasses.map(pc => new vendure_plugin_ref_1.VendurePluginRef(pc));
    }
    const targetPlugins = await (0, prompts_1.multiselect)({
        message: 'Select one or more plugins (use ↑, ↓, space to select)',
        options: pluginClasses.map(c => ({
            value: c,
            label: c.getName(),
        })),
    });
    if ((0, prompts_1.isCancel)(targetPlugins)) {
        (0, prompts_1.cancel)(cancelledMessage);
        process.exit(0);
    }
    return targetPlugins.map(pc => new vendure_plugin_ref_1.VendurePluginRef(pc));
}
exports.selectMultiplePluginClasses = selectMultiplePluginClasses;
async function selectServiceRef(project, plugin, canCreateNew = true) {
    const serviceRefs = getServices(project).filter(sr => {
        return sr.classDeclaration
            .getSourceFile()
            .getDirectoryPath()
            .includes(plugin.getSourceFile().getDirectoryPath());
    });
    if (serviceRefs.length === 0 && !canCreateNew) {
        throw new Error(constants_1.Messages.NoServicesFound);
    }
    const result = await (0, prompts_1.select)({
        message: 'Which service contains the business logic for this API extension?',
        maxItems: 8,
        options: [
            ...(canCreateNew
                ? [
                    {
                        value: 'new',
                        label: `Create new generic service`,
                    },
                ]
                : []),
            ...serviceRefs.map(sr => {
                const features = sr.crudEntityRef
                    ? `CRUD service for ${sr.crudEntityRef.name}`
                    : `Generic service`;
                const label = `${sr.name}: (${features})`;
                return {
                    value: sr,
                    label,
                };
            }),
        ],
    });
    if ((0, prompts_1.isCancel)(result)) {
        (0, prompts_1.cancel)('Cancelled');
        process.exit(0);
    }
    if (result === 'new') {
        return add_service_1.addServiceCommand.run({ type: 'basic', plugin }).then(r => r.serviceRef);
    }
    else {
        return result;
    }
}
exports.selectServiceRef = selectServiceRef;
function getServices(project) {
    const servicesSourceFiles = project.getSourceFiles().filter(sf => {
        return (sf.getDirectory().getPath().endsWith('/services') ||
            sf.getDirectory().getPath().endsWith('/service'));
    });
    return servicesSourceFiles
        .flatMap(sf => sf.getClasses())
        .filter(classDeclaration => classDeclaration.getDecorator('Injectable'))
        .map(classDeclaration => new service_ref_1.ServiceRef(classDeclaration));
}
exports.getServices = getServices;
//# sourceMappingURL=shared-prompts.js.map