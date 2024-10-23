"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addApiExtensionCommand = void 0;
const prompts_1 = require("@clack/prompts");
const change_case_1 = require("change-case");
const path_1 = __importDefault(require("path"));
const ts_morph_1 = require("ts-morph");
const cli_command_1 = require("../../../shared/cli-command");
const shared_prompts_1 = require("../../../shared/shared-prompts");
const ast_utils_1 = require("../../../utilities/ast-utils");
const utils_1 = require("../../../utilities/utils");
const cancelledMessage = 'Add API extension cancelled';
exports.addApiExtensionCommand = new cli_command_1.CliCommand({
    id: 'add-api-extension',
    category: 'Plugin: API',
    description: 'Adds GraphQL API extensions to a plugin',
    run: options => addApiExtension(options),
});
async function addApiExtension(options) {
    const providedVendurePlugin = options === null || options === void 0 ? void 0 : options.plugin;
    const { project } = await (0, shared_prompts_1.analyzeProject)({ providedVendurePlugin, cancelledMessage });
    const plugin = providedVendurePlugin !== null && providedVendurePlugin !== void 0 ? providedVendurePlugin : (await (0, shared_prompts_1.selectPlugin)(project, cancelledMessage));
    const serviceRef = await (0, shared_prompts_1.selectServiceRef)(project, plugin, false);
    const serviceEntityRef = serviceRef.crudEntityRef;
    const modifiedSourceFiles = [];
    let resolver;
    let apiExtensions;
    const scaffoldSpinner = (0, prompts_1.spinner)();
    let queryName = '';
    let mutationName = '';
    if (!serviceEntityRef) {
        const queryNameResult = await (0, prompts_1.text)({
            message: 'Enter a name for the new query',
            initialValue: 'myNewQuery',
        });
        if (!(0, prompts_1.isCancel)(queryNameResult)) {
            queryName = queryNameResult;
        }
        const mutationNameResult = await (0, prompts_1.text)({
            message: 'Enter a name for the new mutation',
            initialValue: 'myNewMutation',
        });
        if (!(0, prompts_1.isCancel)(mutationNameResult)) {
            mutationName = mutationNameResult;
        }
    }
    scaffoldSpinner.start('Generating resolver file...');
    await (0, utils_1.pauseForPromptDisplay)();
    if (serviceEntityRef) {
        resolver = createCrudResolver(project, plugin, serviceRef, serviceEntityRef);
        modifiedSourceFiles.push(resolver.getSourceFile());
    }
    else {
        if ((0, prompts_1.isCancel)(queryName)) {
            (0, prompts_1.cancel)(cancelledMessage);
            process.exit(0);
        }
        resolver = createSimpleResolver(project, plugin, serviceRef, queryName, mutationName);
        if (queryName) {
            serviceRef.classDeclaration.addMethod({
                name: queryName,
                parameters: [
                    { name: 'ctx', type: 'RequestContext' },
                    { name: 'id', type: 'ID' },
                ],
                isAsync: true,
                returnType: 'Promise<boolean>',
                statements: `return true;`,
            });
        }
        if (mutationName) {
            serviceRef.classDeclaration.addMethod({
                name: mutationName,
                parameters: [
                    { name: 'ctx', type: 'RequestContext' },
                    { name: 'id', type: 'ID' },
                ],
                isAsync: true,
                returnType: 'Promise<boolean>',
                statements: `return true;`,
            });
        }
        (0, ast_utils_1.addImportsToFile)(serviceRef.classDeclaration.getSourceFile(), {
            namedImports: ['RequestContext', 'ID'],
            moduleSpecifier: '@vendure/core',
        });
        modifiedSourceFiles.push(resolver.getSourceFile());
    }
    scaffoldSpinner.message('Generating schema definitions...');
    await (0, utils_1.pauseForPromptDisplay)();
    if (serviceEntityRef) {
        apiExtensions = createCrudApiExtension(project, plugin, serviceRef);
    }
    else {
        apiExtensions = createSimpleApiExtension(project, plugin, serviceRef, queryName, mutationName);
    }
    if (apiExtensions) {
        modifiedSourceFiles.push(apiExtensions.getSourceFile());
    }
    scaffoldSpinner.message('Registering API extension with plugin...');
    await (0, utils_1.pauseForPromptDisplay)();
    plugin.addAdminApiExtensions({
        schema: apiExtensions,
        resolvers: [resolver],
    });
    (0, ast_utils_1.addImportsToFile)(plugin.getSourceFile(), {
        namedImports: [resolver.getName()],
        moduleSpecifier: resolver.getSourceFile(),
    });
    if (apiExtensions) {
        (0, ast_utils_1.addImportsToFile)(plugin.getSourceFile(), {
            namedImports: [apiExtensions.getName()],
            moduleSpecifier: apiExtensions.getSourceFile(),
        });
    }
    scaffoldSpinner.stop(`API extensions added`);
    await project.save();
    return {
        project,
        modifiedSourceFiles: [serviceRef.classDeclaration.getSourceFile(), ...modifiedSourceFiles],
        serviceRef,
    };
}
function getResolverFileName(project, serviceRef) {
    let suffix;
    let resolverFileName = '';
    let sourceFileExists = false;
    do {
        resolverFileName =
            (0, change_case_1.paramCase)(serviceRef.name).replace('-service', '') +
                `-admin.resolver${typeof suffix === 'number' ? `-${suffix === null || suffix === void 0 ? void 0 : suffix.toString()}` : ''}.ts`;
        sourceFileExists = !!project.getSourceFile(resolverFileName);
        if (sourceFileExists) {
            suffix = (suffix !== null && suffix !== void 0 ? suffix : 1) + 1;
        }
    } while (sourceFileExists);
    return { resolverFileName, suffix };
}
function createSimpleResolver(project, plugin, serviceRef, queryName, mutationName) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const { resolverFileName, suffix } = getResolverFileName(project, serviceRef);
    const resolverSourceFile = (0, ast_utils_1.createFile)(project, path_1.default.join(__dirname, 'templates/simple-resolver.template.ts'), path_1.default.join(plugin.getPluginDir().getPath(), 'api', resolverFileName));
    const resolverClassDeclaration = resolverSourceFile
        .getClasses()
        .find(cl => cl.getDecorator('Resolver') != null);
    if (!resolverClassDeclaration) {
        throw new Error('Could not find resolver class declaration');
    }
    if (resolverClassDeclaration.getName() === 'SimpleAdminResolver') {
        resolverClassDeclaration.rename(serviceRef.name.replace(/Service$/, '') + 'AdminResolver' + (suffix ? suffix.toString() : ''));
    }
    if (queryName) {
        (_b = (_a = resolverSourceFile.getClass('TemplateService')) === null || _a === void 0 ? void 0 : _a.getMethod('exampleQueryHandler')) === null || _b === void 0 ? void 0 : _b.rename(queryName);
        (_c = resolverClassDeclaration.getMethod('exampleQuery')) === null || _c === void 0 ? void 0 : _c.rename(queryName);
    }
    else {
        (_e = (_d = resolverSourceFile.getClass('TemplateService')) === null || _d === void 0 ? void 0 : _d.getMethod('exampleQueryHandler')) === null || _e === void 0 ? void 0 : _e.remove();
        (_f = resolverClassDeclaration.getMethod('exampleQuery')) === null || _f === void 0 ? void 0 : _f.remove();
    }
    if (mutationName) {
        (_h = (_g = resolverSourceFile
            .getClass('TemplateService')) === null || _g === void 0 ? void 0 : _g.getMethod('exampleMutationHandler')) === null || _h === void 0 ? void 0 : _h.rename(mutationName);
        (_j = resolverClassDeclaration.getMethod('exampleMutation')) === null || _j === void 0 ? void 0 : _j.rename(mutationName);
    }
    else {
        (_l = (_k = resolverSourceFile.getClass('TemplateService')) === null || _k === void 0 ? void 0 : _k.getMethod('exampleMutationHandler')) === null || _l === void 0 ? void 0 : _l.remove();
        (_m = resolverClassDeclaration.getMethod('exampleMutation')) === null || _m === void 0 ? void 0 : _m.remove();
    }
    (_o = resolverClassDeclaration
        .getConstructors()[0]
        .getParameter('templateService')) === null || _o === void 0 ? void 0 : _o.rename(serviceRef.nameCamelCase).setType(serviceRef.name);
    (_p = resolverSourceFile.getClass('TemplateService')) === null || _p === void 0 ? void 0 : _p.remove();
    (0, ast_utils_1.addImportsToFile)(resolverSourceFile, {
        namedImports: [serviceRef.name],
        moduleSpecifier: serviceRef.classDeclaration.getSourceFile(),
    });
    return resolverClassDeclaration;
}
function createCrudResolver(project, plugin, serviceRef, serviceEntityRef) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const resolverSourceFile = (0, ast_utils_1.createFile)(project, path_1.default.join(__dirname, 'templates/crud-resolver.template.ts'), path_1.default.join(plugin.getPluginDir().getPath(), 'api', (0, change_case_1.paramCase)(serviceEntityRef.name) + '-admin.resolver.ts'));
    const resolverClassDeclaration = resolverSourceFile
        .getClass('EntityAdminResolver')
        .rename(serviceEntityRef.name + 'AdminResolver');
    if (serviceRef.features.findOne) {
        const findOneMethod = (_a = resolverClassDeclaration
            .getMethod('entity')) === null || _a === void 0 ? void 0 : _a.rename(serviceEntityRef.nameCamelCase);
        const serviceFindOneMethod = serviceRef.classDeclaration.getMethod('findOne');
        if (serviceFindOneMethod) {
            if (!serviceFindOneMethod
                .getParameters()
                .find(p => p.getName() === 'relations' && p.getType().getText().includes('RelationPaths'))) {
                findOneMethod === null || findOneMethod === void 0 ? void 0 : findOneMethod.getParameters()[2].remove();
                findOneMethod === null || findOneMethod === void 0 ? void 0 : findOneMethod.setBodyText(`return this.${serviceRef.nameCamelCase}.findOne(ctx, args.id);`);
            }
        }
    }
    else {
        (_b = resolverClassDeclaration.getMethod('entity')) === null || _b === void 0 ? void 0 : _b.remove();
    }
    if (serviceRef.features.findAll) {
        const findAllMethod = (_c = resolverClassDeclaration
            .getMethod('entities')) === null || _c === void 0 ? void 0 : _c.rename(serviceEntityRef.nameCamelCase + 's');
        const serviceFindAllMethod = serviceRef.classDeclaration.getMethod('findAll');
        if (serviceFindAllMethod) {
            if (!serviceFindAllMethod
                .getParameters()
                .find(p => p.getName() === 'relations' && p.getType().getText().includes('RelationPaths'))) {
                findAllMethod === null || findAllMethod === void 0 ? void 0 : findAllMethod.getParameters()[2].remove();
                findAllMethod === null || findAllMethod === void 0 ? void 0 : findAllMethod.setBodyText(`return this.${serviceRef.nameCamelCase}.findAll(ctx, args.options || undefined);`);
            }
        }
    }
    else {
        (_d = resolverClassDeclaration.getMethod('entities')) === null || _d === void 0 ? void 0 : _d.remove();
    }
    if (serviceRef.features.create) {
        (_e = resolverClassDeclaration.getMethod('createEntity')) === null || _e === void 0 ? void 0 : _e.rename('create' + serviceEntityRef.name);
    }
    else {
        (_f = resolverClassDeclaration.getMethod('createEntity')) === null || _f === void 0 ? void 0 : _f.remove();
    }
    if (serviceRef.features.update) {
        (_g = resolverClassDeclaration.getMethod('updateEntity')) === null || _g === void 0 ? void 0 : _g.rename('update' + serviceEntityRef.name);
    }
    else {
        (_h = resolverClassDeclaration.getMethod('updateEntity')) === null || _h === void 0 ? void 0 : _h.remove();
    }
    if (serviceRef.features.delete) {
        (_j = resolverClassDeclaration.getMethod('deleteEntity')) === null || _j === void 0 ? void 0 : _j.rename('delete' + serviceEntityRef.name);
    }
    else {
        (_k = resolverClassDeclaration.getMethod('deleteEntity')) === null || _k === void 0 ? void 0 : _k.remove();
    }
    (0, ast_utils_1.customizeCreateUpdateInputInterfaces)(resolverSourceFile, serviceEntityRef);
    (_l = resolverClassDeclaration
        .getConstructors()[0]
        .getParameter('templateService')) === null || _l === void 0 ? void 0 : _l.rename(serviceRef.nameCamelCase).setType(serviceRef.name);
    (_m = resolverSourceFile.getClass('TemplateEntity')) === null || _m === void 0 ? void 0 : _m.rename(serviceEntityRef.name).remove();
    (_o = resolverSourceFile.getClass('TemplateService')) === null || _o === void 0 ? void 0 : _o.remove();
    (0, ast_utils_1.addImportsToFile)(resolverSourceFile, {
        namedImports: [serviceRef.name],
        moduleSpecifier: serviceRef.classDeclaration.getSourceFile(),
    });
    (0, ast_utils_1.addImportsToFile)(resolverSourceFile, {
        namedImports: [serviceEntityRef.name],
        moduleSpecifier: serviceEntityRef.classDeclaration.getSourceFile(),
    });
    return resolverClassDeclaration;
}
function createSimpleApiExtension(project, plugin, serviceRef, queryName, mutationName) {
    var _a, _b, _c;
    const apiExtensionsFile = getOrCreateApiExtensionsFile(project, plugin);
    const adminApiExtensions = apiExtensionsFile.getVariableDeclaration('adminApiExtensions');
    const insertAtIndex = (_a = adminApiExtensions === null || adminApiExtensions === void 0 ? void 0 : adminApiExtensions.getParent().getParent().getChildIndex()) !== null && _a !== void 0 ? _a : 2;
    const schemaVariableName = `${serviceRef.nameCamelCase.replace(/Service$/, '')}AdminApiExtensions`;
    const existingSchemaVariable = apiExtensionsFile.getVariableStatement(schemaVariableName);
    if (!existingSchemaVariable) {
        apiExtensionsFile.insertVariableStatement(insertAtIndex, {
            declarationKind: ts_morph_1.VariableDeclarationKind.Const,
            declarations: [
                {
                    name: schemaVariableName,
                    initializer: writer => {
                        writer.writeLine(`gql\``);
                        writer.indent(() => {
                            if (queryName) {
                                writer.writeLine(`  extend type Query {`);
                                writer.writeLine(`    ${queryName}(id: ID!): Boolean!`);
                                writer.writeLine(`  }`);
                            }
                            writer.newLine();
                            if (mutationName) {
                                writer.writeLine(`  extend type Mutation {`);
                                writer.writeLine(`    ${mutationName}(id: ID!): Boolean!`);
                                writer.writeLine(`  }`);
                            }
                        });
                        writer.write(`\``);
                    },
                },
            ],
        });
    }
    else {
        const taggedTemplateLiteral = (_c = (_b = existingSchemaVariable
            .getDeclarations()[0]) === null || _b === void 0 ? void 0 : _b.getFirstChildByKind(ts_morph_1.SyntaxKind.TaggedTemplateExpression)) === null || _c === void 0 ? void 0 : _c.getChildren()[1];
        if (!taggedTemplateLiteral) {
            prompts_1.log.error('Could not update schema automatically');
        }
        else {
            appendToGqlTemplateLiteral(existingSchemaVariable.getDeclarations()[0], writer => {
                writer.indent(() => {
                    if (queryName) {
                        writer.writeLine(`  extend type Query {`);
                        writer.writeLine(`    ${queryName}(id: ID!): Boolean!`);
                        writer.writeLine(`  }`);
                    }
                    writer.newLine();
                    if (mutationName) {
                        writer.writeLine(`  extend type Mutation {`);
                        writer.writeLine(`    ${mutationName}(id: ID!): Boolean!`);
                        writer.writeLine(`  }`);
                    }
                });
            });
        }
    }
    addSchemaToApiExtensionsTemplateLiteral(adminApiExtensions, schemaVariableName);
    return adminApiExtensions;
}
function createCrudApiExtension(project, plugin, serviceRef) {
    var _a;
    const apiExtensionsFile = getOrCreateApiExtensionsFile(project, plugin);
    const adminApiExtensions = apiExtensionsFile.getVariableDeclaration('adminApiExtensions');
    const insertAtIndex = (_a = adminApiExtensions === null || adminApiExtensions === void 0 ? void 0 : adminApiExtensions.getParent().getParent().getChildIndex()) !== null && _a !== void 0 ? _a : 2;
    const schemaVariableName = `${serviceRef.nameCamelCase.replace(/Service$/, '')}AdminApiExtensions`;
    apiExtensionsFile.insertVariableStatement(insertAtIndex, {
        declarationKind: ts_morph_1.VariableDeclarationKind.Const,
        declarations: [
            {
                name: schemaVariableName,
                initializer: writer => {
                    writer.writeLine(`gql\``);
                    const entityRef = serviceRef.crudEntityRef;
                    if (entityRef) {
                        writer.indent(() => {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                            if (entityRef.isTranslatable()) {
                                const translationClass = entityRef.getTranslationClass();
                                if (translationClass) {
                                    writer.writeLine(`  type ${(_a = translationClass.getName()) !== null && _a !== void 0 ? _a : ''} {`);
                                    writer.writeLine(`    id: ID!`);
                                    writer.writeLine(`    createdAt: DateTime!`);
                                    writer.writeLine(`    updatedAt: DateTime!`);
                                    writer.writeLine(`    languageCode: LanguageCode!`);
                                    for (const { name, type, nullable } of entityRef.getProps()) {
                                        if (type.getText().includes('LocaleString')) {
                                            writer.writeLine(`    ${name}: String${nullable ? '' : '!'}`);
                                        }
                                    }
                                    writer.writeLine(`  }`);
                                    writer.newLine();
                                }
                            }
                            writer.writeLine(`  type ${entityRef.name} implements Node {`);
                            writer.writeLine(`    id: ID!`);
                            writer.writeLine(`    createdAt: DateTime!`);
                            writer.writeLine(`    updatedAt: DateTime!`);
                            for (const { name, type, nullable } of entityRef.getProps()) {
                                const graphQlType = getGraphQLType(type);
                                if (graphQlType) {
                                    writer.writeLine(`    ${name}: ${graphQlType}${nullable ? '' : '!'}`);
                                }
                            }
                            if (entityRef.isTranslatable()) {
                                writer.writeLine(`    translations: [${(_c = (_b = entityRef.getTranslationClass()) === null || _b === void 0 ? void 0 : _b.getName()) !== null && _c !== void 0 ? _c : ''}!]!`);
                            }
                            writer.writeLine(`  }`);
                            writer.newLine();
                            writer.writeLine(`  type ${entityRef.name}List implements PaginatedList {`);
                            writer.writeLine(`    items: [${entityRef.name}!]!`);
                            writer.writeLine(`    totalItems: Int!`);
                            writer.writeLine(`  }`);
                            writer.newLine();
                            writer.writeLine(`  # Generated at run-time by Vendure`);
                            writer.writeLine(`  input ${entityRef.name}ListOptions`);
                            writer.newLine();
                            writer.writeLine(`  extend type Query {`);
                            if (serviceRef.features.findOne) {
                                writer.writeLine(`    ${entityRef.nameCamelCase}(id: ID!): ${entityRef.name}`);
                            }
                            if (serviceRef.features.findAll) {
                                writer.writeLine(`    ${entityRef.nameCamelCase}s(options: ${entityRef.name}ListOptions): ${entityRef.name}List!`);
                            }
                            writer.writeLine(`  }`);
                            writer.newLine();
                            if (entityRef.isTranslatable() &&
                                (serviceRef.features.create || serviceRef.features.update)) {
                                writer.writeLine(`  input ${(_e = (_d = entityRef.getTranslationClass()) === null || _d === void 0 ? void 0 : _d.getName()) !== null && _e !== void 0 ? _e : ''}Input {`);
                                writer.writeLine(`    id: ID`);
                                writer.writeLine(`    languageCode: LanguageCode!`);
                                for (const { name, type, nullable } of entityRef.getProps()) {
                                    if (type.getText().includes('LocaleString')) {
                                        writer.writeLine(`    ${name}: String`);
                                    }
                                }
                                writer.writeLine(`  }`);
                                writer.newLine();
                            }
                            if (serviceRef.features.create) {
                                writer.writeLine(`  input Create${entityRef.name}Input {`);
                                for (const { name, type, nullable } of entityRef.getProps()) {
                                    const graphQlType = getGraphQLType(type);
                                    if (graphQlType) {
                                        writer.writeLine(`    ${name}: ${graphQlType}${nullable ? '' : '!'}`);
                                    }
                                }
                                if (entityRef.isTranslatable()) {
                                    writer.writeLine(`    translations: [${(_g = (_f = entityRef.getTranslationClass()) === null || _f === void 0 ? void 0 : _f.getName()) !== null && _g !== void 0 ? _g : ''}Input!]!`);
                                }
                                writer.writeLine(`  }`);
                                writer.newLine();
                            }
                            if (serviceRef.features.update) {
                                writer.writeLine(`  input Update${entityRef.name}Input {`);
                                writer.writeLine(`    id: ID!`);
                                for (const { name, type } of entityRef.getProps()) {
                                    const graphQlType = getGraphQLType(type);
                                    if (graphQlType) {
                                        writer.writeLine(`    ${name}: ${graphQlType}`);
                                    }
                                }
                                if (entityRef.isTranslatable()) {
                                    writer.writeLine(`    translations: [${(_j = (_h = entityRef.getTranslationClass()) === null || _h === void 0 ? void 0 : _h.getName()) !== null && _j !== void 0 ? _j : ''}Input!]`);
                                }
                                writer.writeLine(`  }`);
                                writer.newLine();
                            }
                            if (serviceRef.features.create ||
                                serviceRef.features.update ||
                                serviceRef.features.delete) {
                                writer.writeLine(`  extend type Mutation {`);
                                if (serviceRef.features.create) {
                                    writer.writeLine(`    create${entityRef.name}(input: Create${entityRef.name}Input!): ${entityRef.name}!`);
                                }
                                if (serviceRef.features.update) {
                                    writer.writeLine(`    update${entityRef.name}(input: Update${entityRef.name}Input!): ${entityRef.name}!`);
                                }
                                if (serviceRef.features.delete) {
                                    writer.writeLine(`    delete${entityRef.name}(id: ID!): DeletionResponse!`);
                                }
                                writer.writeLine(`  }`);
                            }
                        });
                    }
                    writer.write(`\``);
                },
            },
        ],
    });
    addSchemaToApiExtensionsTemplateLiteral(adminApiExtensions, schemaVariableName);
    return adminApiExtensions;
}
function addSchemaToApiExtensionsTemplateLiteral(adminApiExtensions, schemaVariableName) {
    if (adminApiExtensions) {
        if (adminApiExtensions.getText().includes(`  \${${schemaVariableName}}`)) {
            return;
        }
        appendToGqlTemplateLiteral(adminApiExtensions, writer => {
            writer.writeLine(`  \${${schemaVariableName}}`);
        });
    }
}
function appendToGqlTemplateLiteral(variableDeclaration, append) {
    const initializer = variableDeclaration.getInitializer();
    if (ts_morph_1.Node.isTaggedTemplateExpression(initializer)) {
        variableDeclaration
            .setInitializer(writer => {
            writer.write(`gql\``);
            const template = initializer.getTemplate();
            if (ts_morph_1.Node.isNoSubstitutionTemplateLiteral(template)) {
                writer.write(`${template.getLiteralValue()}`);
            }
            else {
                writer.write(template.getText().replace(/^`/, '').replace(/`$/, ''));
            }
            append(writer);
            writer.write(`\``);
        })
            .formatText();
    }
}
function getGraphQLType(type) {
    if (type.isString()) {
        return 'String';
    }
    if (type.isBoolean()) {
        return 'Boolean';
    }
    if (type.isNumber()) {
        return 'Int';
    }
    if (type.isObject() && type.getText() === 'Date') {
        return 'DateTime';
    }
    if (type.getText().includes('LocaleString')) {
        return 'String';
    }
    return;
}
function getOrCreateApiExtensionsFile(project, plugin) {
    const existingApiExtensionsFile = project.getSourceFiles().find(sf => {
        const filePath = sf.getDirectory().getPath();
        return (sf.getBaseName() === 'api-extensions.ts' &&
            filePath.includes(plugin.getPluginDir().getPath()) &&
            filePath.endsWith('/api'));
    });
    if (existingApiExtensionsFile) {
        return existingApiExtensionsFile;
    }
    return (0, ast_utils_1.createFile)(project, path_1.default.join(__dirname, 'templates/api-extensions.template.ts'), path_1.default.join(plugin.getPluginDir().getPath(), 'api', 'api-extensions.ts'));
}
//# sourceMappingURL=add-api-extension.js.map