"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addServiceCommand = void 0;
const prompts_1 = require("@clack/prompts");
const change_case_1 = require("change-case");
const path_1 = __importDefault(require("path"));
const ts_morph_1 = require("ts-morph");
const constants_1 = require("../../../constants");
const cli_command_1 = require("../../../shared/cli-command");
const service_ref_1 = require("../../../shared/service-ref");
const shared_prompts_1 = require("../../../shared/shared-prompts");
const ast_utils_1 = require("../../../utilities/ast-utils");
const utils_1 = require("../../../utilities/utils");
const add_entity_1 = require("../entity/add-entity");
const cancelledMessage = 'Add service cancelled';
exports.addServiceCommand = new cli_command_1.CliCommand({
    id: 'add-service',
    category: 'Plugin: Service',
    description: 'Add a new service to a plugin',
    run: options => addService(options),
});
async function addService(providedOptions) {
    var _a, _b;
    const providedVendurePlugin = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.plugin;
    const { project } = await (0, shared_prompts_1.analyzeProject)({ providedVendurePlugin, cancelledMessage });
    const vendurePlugin = providedVendurePlugin !== null && providedVendurePlugin !== void 0 ? providedVendurePlugin : (await (0, shared_prompts_1.selectPlugin)(project, cancelledMessage));
    const modifiedSourceFiles = [];
    const type = (_a = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.type) !== null && _a !== void 0 ? _a : (await (0, prompts_1.select)({
        message: 'What type of service would you like to add?',
        options: [
            { value: 'basic', label: 'Basic empty service' },
            { value: 'entity', label: 'Service to perform CRUD operations on an entity' },
        ],
        maxItems: 10,
    }));
    if ((0, prompts_1.isCancel)(type)) {
        (0, prompts_1.cancel)('Cancelled');
        process.exit(0);
    }
    const options = {
        type: type,
        serviceName: 'MyService',
    };
    if (type === 'entity') {
        let entityRef;
        try {
            entityRef = await (0, shared_prompts_1.selectEntity)(vendurePlugin);
        }
        catch (e) {
            if (e.message === constants_1.Messages.NoEntitiesFound) {
                prompts_1.log.info(`No entities found in plugin ${vendurePlugin.name}. Let's create one first.`);
                const result = await add_entity_1.addEntityCommand.run({ plugin: vendurePlugin });
                entityRef = result.entityRef;
                modifiedSourceFiles.push(...result.modifiedSourceFiles);
            }
            else {
                throw e;
            }
        }
        options.entityRef = entityRef;
        options.serviceName = `${entityRef.name}Service`;
    }
    const serviceSpinner = (0, prompts_1.spinner)();
    let serviceSourceFile;
    let serviceClassDeclaration;
    if (options.type === 'basic') {
        const name = await (0, prompts_1.text)({
            message: 'What is the name of the new service?',
            initialValue: 'MyService',
            validate: input => {
                if (!input) {
                    return 'The service name cannot be empty';
                }
                if (!constants_1.pascalCaseRegex.test(input)) {
                    return 'The service name must be in PascalCase, e.g. "MyService"';
                }
            },
        });
        if ((0, prompts_1.isCancel)(name)) {
            (0, prompts_1.cancel)(cancelledMessage);
            process.exit(0);
        }
        options.serviceName = name;
        serviceSpinner.start(`Creating ${options.serviceName}...`);
        const serviceSourceFilePath = getServiceFilePath(vendurePlugin, options.serviceName);
        await (0, utils_1.pauseForPromptDisplay)();
        serviceSourceFile = (0, ast_utils_1.createFile)(project, path_1.default.join(__dirname, 'templates/basic-service.template.ts'), serviceSourceFilePath);
        serviceClassDeclaration = serviceSourceFile
            .getClass('BasicServiceTemplate')
            .rename(options.serviceName);
    }
    else {
        serviceSpinner.start(`Creating ${options.serviceName}...`);
        await (0, utils_1.pauseForPromptDisplay)();
        const serviceSourceFilePath = getServiceFilePath(vendurePlugin, options.serviceName);
        serviceSourceFile = (0, ast_utils_1.createFile)(project, path_1.default.join(__dirname, 'templates/entity-service.template.ts'), serviceSourceFilePath);
        serviceClassDeclaration = serviceSourceFile
            .getClass('EntityServiceTemplate')
            .rename(options.serviceName);
        const entityRef = options.entityRef;
        if (!entityRef) {
            throw new Error('Entity class not found');
        }
        const templateEntityClass = serviceSourceFile.getClass('TemplateEntity');
        if (templateEntityClass) {
            templateEntityClass.rename(entityRef.name);
            templateEntityClass.remove();
        }
        (0, ast_utils_1.addImportsToFile)(serviceClassDeclaration.getSourceFile(), {
            moduleSpecifier: entityRef.classDeclaration.getSourceFile(),
            namedImports: [entityRef.name],
        });
        const templateTranslationEntityClass = serviceSourceFile.getClass('TemplateEntityTranslation');
        if (entityRef.isTranslatable()) {
            const translationEntityClass = entityRef.getTranslationClass();
            if (translationEntityClass && templateTranslationEntityClass) {
                templateTranslationEntityClass.rename(translationEntityClass === null || translationEntityClass === void 0 ? void 0 : translationEntityClass.getName());
                templateTranslationEntityClass.remove();
                (0, ast_utils_1.addImportsToFile)(serviceClassDeclaration.getSourceFile(), {
                    moduleSpecifier: translationEntityClass.getSourceFile(),
                    namedImports: [translationEntityClass.getName()],
                });
            }
        }
        else {
            templateTranslationEntityClass === null || templateTranslationEntityClass === void 0 ? void 0 : templateTranslationEntityClass.remove();
        }
        (0, ast_utils_1.customizeCreateUpdateInputInterfaces)(serviceSourceFile, entityRef);
        customizeFindOneMethod(serviceClassDeclaration, entityRef);
        customizeFindAllMethod(serviceClassDeclaration, entityRef);
        customizeCreateMethod(serviceClassDeclaration, entityRef);
        customizeUpdateMethod(serviceClassDeclaration, entityRef);
        removedUnusedConstructorArgs(serviceClassDeclaration, entityRef);
    }
    const pluginOptions = vendurePlugin.getPluginOptions();
    if (pluginOptions) {
        (0, ast_utils_1.addImportsToFile)(serviceSourceFile, {
            moduleSpecifier: pluginOptions.constantDeclaration.getSourceFile(),
            namedImports: [pluginOptions.constantDeclaration.getName()],
        });
        (0, ast_utils_1.addImportsToFile)(serviceSourceFile, {
            moduleSpecifier: pluginOptions.typeDeclaration.getSourceFile(),
            namedImports: [pluginOptions.typeDeclaration.getName()],
        });
        (0, ast_utils_1.addImportsToFile)(serviceSourceFile, {
            moduleSpecifier: '@nestjs/common',
            namedImports: ['Inject'],
        });
        (_b = serviceClassDeclaration
            .getConstructors()[0]) === null || _b === void 0 ? void 0 : _b.addParameter({
            scope: ts_morph_1.Scope.Private,
            name: 'options',
            type: pluginOptions.typeDeclaration.getName(),
            decorators: [{ name: 'Inject', arguments: [pluginOptions.constantDeclaration.getName()] }],
        }).formatText();
    }
    modifiedSourceFiles.push(serviceSourceFile);
    serviceSpinner.message(`Registering service with plugin...`);
    vendurePlugin.addProvider(options.serviceName);
    (0, ast_utils_1.addImportsToFile)(vendurePlugin.classDeclaration.getSourceFile(), {
        moduleSpecifier: serviceSourceFile,
        namedImports: [options.serviceName],
    });
    await project.save();
    serviceSpinner.stop(`${options.serviceName} created`);
    return {
        project,
        modifiedSourceFiles,
        serviceRef: new service_ref_1.ServiceRef(serviceClassDeclaration),
    };
}
function getServiceFilePath(plugin, serviceName) {
    const serviceFileName = (0, change_case_1.paramCase)(serviceName).replace(/-service$/, '.service');
    return path_1.default.join(plugin.getPluginDir().getPath(), 'services', `${serviceFileName}.ts`);
}
function customizeFindOneMethod(serviceClassDeclaration, entityRef) {
    const findOneMethod = serviceClassDeclaration.getMethod('findOne');
    findOneMethod
        .setBodyText(writer => {
        writer.write(` return this.connection
            .getRepository(ctx, ${entityRef.name})
            .findOne({
                where: { id },
                relations,
            })`);
        if (entityRef.isTranslatable()) {
            writer.write(`.then(entity => entity && this.translator.translate(entity, ctx));`);
        }
        else {
            writer.write(`;`);
        }
    })
        .formatText();
    if (!entityRef.isTranslatable()) {
        findOneMethod.setReturnType(`Promise<${entityRef.name} | null>`);
    }
}
function customizeFindAllMethod(serviceClassDeclaration, entityRef) {
    const findAllMethod = serviceClassDeclaration.getMethod('findAll');
    findAllMethod
        .setBodyText(writer => {
        writer.writeLine(`return this.listQueryBuilder`);
        writer.write(`.build(${entityRef.name}, options,`).block(() => {
            writer.writeLine('relations,');
            writer.writeLine('ctx,');
        });
        writer.write(')');
        writer.write('.getManyAndCount()');
        writer.write('.then(([items, totalItems]) =>').block(() => {
            writer.write('return').block(() => {
                if (entityRef.isTranslatable()) {
                    writer.writeLine('items: items.map(item => this.translator.translate(item, ctx)),');
                }
                else {
                    writer.writeLine('items,');
                }
                writer.writeLine('totalItems,');
            });
        });
        writer.write(');');
    })
        .formatText();
    if (!entityRef.isTranslatable()) {
        findAllMethod.setReturnType(`Promise<PaginatedList<${entityRef.name}>>`);
    }
}
function customizeCreateMethod(serviceClassDeclaration, entityRef) {
    const createMethod = serviceClassDeclaration.getMethod('create');
    createMethod
        .setBodyText(writer => {
        var _a;
        if (entityRef.isTranslatable()) {
            writer.write(`const newEntity = await this.translatableSaver.create({
                                ctx,
                                input,
                                entityType: ${entityRef.name},
                                translationType: ${(_a = entityRef.getTranslationClass()) === null || _a === void 0 ? void 0 : _a.getName()},
                                beforeSave: async f => {
                                    // Any pre-save logic can go here
                                },
                            });`);
        }
        else {
            writer.writeLine(`const newEntity = await this.connection.getRepository(ctx, ${entityRef.name}).save(input);`);
        }
        if (entityRef.hasCustomFields()) {
            writer.writeLine(`await this.customFieldRelationService.updateRelations(ctx, ${entityRef.name}, input, newEntity);`);
        }
        writer.writeLine(`return assertFound(this.findOne(ctx, newEntity.id));`);
    })
        .formatText();
    if (!entityRef.isTranslatable()) {
        createMethod.setReturnType(`Promise<${entityRef.name}>`);
    }
}
function customizeUpdateMethod(serviceClassDeclaration, entityRef) {
    const updateMethod = serviceClassDeclaration.getMethod('update');
    updateMethod
        .setBodyText(writer => {
        var _a;
        if (entityRef.isTranslatable()) {
            writer.write(`const updatedEntity = await this.translatableSaver.update({
                                ctx,
                                input,
                                entityType: ${entityRef.name},
                                translationType: ${(_a = entityRef.getTranslationClass()) === null || _a === void 0 ? void 0 : _a.getName()},
                                beforeSave: async f => {
                                    // Any pre-save logic can go here
                                },
                            });`);
        }
        else {
            writer.writeLine(`const entity = await this.connection.getEntityOrThrow(ctx, ${entityRef.name}, input.id);`);
            writer.writeLine(`const updatedEntity = patchEntity(entity, input);`);
            writer.writeLine(`await this.connection.getRepository(ctx, ${entityRef.name}).save(updatedEntity, { reload: false });`);
        }
        if (entityRef.hasCustomFields()) {
            writer.writeLine(`await this.customFieldRelationService.updateRelations(ctx, ${entityRef.name}, input, updatedEntity);`);
        }
        writer.writeLine(`return assertFound(this.findOne(ctx, updatedEntity.id));`);
    })
        .formatText();
    if (!entityRef.isTranslatable()) {
        updateMethod.setReturnType(`Promise<${entityRef.name}>`);
    }
}
function removedUnusedConstructorArgs(serviceClassDeclaration, entityRef) {
    const isTranslatable = entityRef.isTranslatable();
    const hasCustomFields = entityRef.hasCustomFields();
    serviceClassDeclaration.getConstructors().forEach(constructor => {
        constructor.getParameters().forEach(param => {
            const paramName = param.getName();
            if ((paramName === 'translatableSaver' || paramName === 'translator') && !isTranslatable) {
                param.remove();
            }
            if (paramName === 'customFieldRelationService' && !hasCustomFields) {
                param.remove();
            }
        });
    });
}
//# sourceMappingURL=add-service.js.map