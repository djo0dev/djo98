"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomEntityName = exports.addEntityCommand = void 0;
const prompts_1 = require("@clack/prompts");
const change_case_1 = require("change-case");
const path_1 = __importDefault(require("path"));
const constants_1 = require("../../../constants");
const cli_command_1 = require("../../../shared/cli-command");
const entity_ref_1 = require("../../../shared/entity-ref");
const shared_prompts_1 = require("../../../shared/shared-prompts");
const ast_utils_1 = require("../../../utilities/ast-utils");
const utils_1 = require("../../../utilities/utils");
const add_entity_to_plugin_1 = require("./codemods/add-entity-to-plugin/add-entity-to-plugin");
const cancelledMessage = 'Add entity cancelled';
exports.addEntityCommand = new cli_command_1.CliCommand({
    id: 'add-entity',
    category: 'Plugin: Entity',
    description: 'Add a new entity to a plugin',
    run: options => addEntity(options),
});
async function addEntity(options) {
    var _a;
    const providedVendurePlugin = options === null || options === void 0 ? void 0 : options.plugin;
    const { project } = await (0, shared_prompts_1.analyzeProject)({ providedVendurePlugin, cancelledMessage });
    const vendurePlugin = providedVendurePlugin !== null && providedVendurePlugin !== void 0 ? providedVendurePlugin : (await (0, shared_prompts_1.selectPlugin)(project, cancelledMessage));
    const modifiedSourceFiles = [];
    const customEntityName = (_a = options === null || options === void 0 ? void 0 : options.className) !== null && _a !== void 0 ? _a : (await getCustomEntityName(cancelledMessage));
    const context = {
        className: customEntityName,
        fileName: (0, change_case_1.paramCase)(customEntityName) + '.entity',
        translationFileName: (0, change_case_1.paramCase)(customEntityName) + '-translation.entity',
        features: await getFeatures(options),
    };
    const entitySpinner = (0, prompts_1.spinner)();
    entitySpinner.start('Creating entity...');
    await (0, utils_1.pauseForPromptDisplay)();
    const { entityClass, translationClass } = createEntity(vendurePlugin, context);
    (0, add_entity_to_plugin_1.addEntityToPlugin)(vendurePlugin, entityClass);
    modifiedSourceFiles.push(entityClass.getSourceFile());
    if (context.features.translatable) {
        (0, add_entity_to_plugin_1.addEntityToPlugin)(vendurePlugin, translationClass);
        modifiedSourceFiles.push(translationClass.getSourceFile());
    }
    entitySpinner.stop('Entity created');
    await project.save();
    return {
        project,
        modifiedSourceFiles,
        entityRef: new entity_ref_1.EntityRef(entityClass),
    };
}
async function getFeatures(options) {
    if (options === null || options === void 0 ? void 0 : options.features) {
        return options === null || options === void 0 ? void 0 : options.features;
    }
    const features = await (0, prompts_1.multiselect)({
        message: 'Entity features (use ↑, ↓, space to select)',
        required: false,
        initialValues: ['customFields'],
        options: [
            {
                label: 'Custom fields',
                value: 'customFields',
                hint: 'Adds support for custom fields on this entity',
            },
            {
                label: 'Translatable',
                value: 'translatable',
                hint: 'Adds support for localized properties on this entity',
            },
        ],
    });
    if ((0, prompts_1.isCancel)(features)) {
        (0, prompts_1.cancel)(cancelledMessage);
        process.exit(0);
    }
    return {
        customFields: features.includes('customFields'),
        translatable: features.includes('translatable'),
    };
}
function createEntity(plugin, options) {
    var _a, _b, _c, _d;
    const entitiesDir = path_1.default.join(plugin.getPluginDir().getPath(), 'entities');
    const entityFile = (0, ast_utils_1.createFile)(plugin.getSourceFile().getProject(), path_1.default.join(__dirname, 'templates/entity.template.ts'), path_1.default.join(entitiesDir, `${options.fileName}.ts`));
    const translationFile = (0, ast_utils_1.createFile)(plugin.getSourceFile().getProject(), path_1.default.join(__dirname, 'templates/entity-translation.template.ts'), path_1.default.join(entitiesDir, `${options.translationFileName}.ts`));
    const entityClass = entityFile.getClass('ScaffoldEntity');
    const customFieldsClass = entityFile.getClass('ScaffoldEntityCustomFields');
    const translationClass = translationFile.getClass('ScaffoldTranslation');
    const translationCustomFieldsClass = translationFile.getClass('ScaffoldEntityCustomFieldsTranslation');
    if (!options.features.customFields) {
        customFieldsClass === null || customFieldsClass === void 0 ? void 0 : customFieldsClass.remove();
        translationCustomFieldsClass === null || translationCustomFieldsClass === void 0 ? void 0 : translationCustomFieldsClass.remove();
        removeCustomFieldsFromClass(entityClass);
        removeCustomFieldsFromClass(translationClass);
    }
    if (!options.features.translatable) {
        translationClass === null || translationClass === void 0 ? void 0 : translationClass.remove();
        (_a = entityClass === null || entityClass === void 0 ? void 0 : entityClass.getProperty('localizedName')) === null || _a === void 0 ? void 0 : _a.remove();
        (_b = entityClass === null || entityClass === void 0 ? void 0 : entityClass.getProperty('translations')) === null || _b === void 0 ? void 0 : _b.remove();
        removeImplementsFromClass('Translatable', entityClass);
        translationFile.delete();
    }
    else {
        (_c = entityFile
            .getImportDeclaration('./entity-translation.template')) === null || _c === void 0 ? void 0 : _c.setModuleSpecifier(`./${options.translationFileName}`);
        (_d = translationFile
            .getImportDeclaration('./entity.template')) === null || _d === void 0 ? void 0 : _d.setModuleSpecifier(`./${options.fileName}`);
    }
    entityClass === null || entityClass === void 0 ? void 0 : entityClass.rename(options.className);
    if (!(customFieldsClass === null || customFieldsClass === void 0 ? void 0 : customFieldsClass.wasForgotten())) {
        customFieldsClass === null || customFieldsClass === void 0 ? void 0 : customFieldsClass.rename(`${options.className}CustomFields`);
    }
    if (!(translationClass === null || translationClass === void 0 ? void 0 : translationClass.wasForgotten())) {
        translationClass === null || translationClass === void 0 ? void 0 : translationClass.rename(`${options.className}Translation`);
    }
    if (!(translationCustomFieldsClass === null || translationCustomFieldsClass === void 0 ? void 0 : translationCustomFieldsClass.wasForgotten())) {
        translationCustomFieldsClass === null || translationCustomFieldsClass === void 0 ? void 0 : translationCustomFieldsClass.rename(`${options.className}CustomFieldsTranslation`);
    }
    return { entityClass: entityClass, translationClass: translationClass };
}
function removeCustomFieldsFromClass(entityClass) {
    var _a;
    (_a = entityClass === null || entityClass === void 0 ? void 0 : entityClass.getProperty('customFields')) === null || _a === void 0 ? void 0 : _a.remove();
    removeImplementsFromClass('HasCustomFields', entityClass);
}
function removeImplementsFromClass(implementsName, entityClass) {
    var _a;
    const index = (_a = entityClass === null || entityClass === void 0 ? void 0 : entityClass.getImplements().findIndex(i => i.getText() === implementsName)) !== null && _a !== void 0 ? _a : -1;
    if (index > -1) {
        entityClass === null || entityClass === void 0 ? void 0 : entityClass.removeImplements(index);
    }
}
async function getCustomEntityName(_cancelledMessage) {
    const entityName = await (0, prompts_1.text)({
        message: 'What is the name of the custom entity?',
        initialValue: '',
        validate: input => {
            if (!input) {
                return 'The custom entity name cannot be empty';
            }
            if (!constants_1.pascalCaseRegex.test(input)) {
                return 'The custom entity name must be in PascalCase, e.g. "ProductReview"';
            }
        },
    });
    if ((0, prompts_1.isCancel)(entityName)) {
        (0, prompts_1.cancel)(_cancelledMessage);
        process.exit(0);
    }
    return (0, change_case_1.pascalCase)(entityName);
}
exports.getCustomEntityName = getCustomEntityName;
//# sourceMappingURL=add-entity.js.map