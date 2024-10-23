"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendurePluginRef = void 0;
const ts_morph_1 = require("ts-morph");
const constants_1 = require("../constants");
const entity_ref_1 = require("./entity-ref");
class VendurePluginRef {
    constructor(classDeclaration) {
        this.classDeclaration = classDeclaration;
    }
    get name() {
        return this.classDeclaration.getName();
    }
    getSourceFile() {
        return this.classDeclaration.getSourceFile();
    }
    getPluginDir() {
        return this.classDeclaration.getSourceFile().getDirectory();
    }
    getMetadataOptions() {
        const pluginDecorator = this.classDeclaration.getDecorator('VendurePlugin');
        if (!pluginDecorator) {
            throw new Error('Could not find VendurePlugin decorator');
        }
        const pluginOptions = pluginDecorator.getArguments()[0];
        if (!pluginOptions || !ts_morph_1.Node.isObjectLiteralExpression(pluginOptions)) {
            throw new Error('Could not find VendurePlugin options');
        }
        return pluginOptions;
    }
    getPluginOptions() {
        var _a, _b;
        const metadataOptions = this.getMetadataOptions();
        const staticOptions = this.classDeclaration.getStaticProperty('options');
        const typeDeclaration = staticOptions === null || staticOptions === void 0 ? void 0 : staticOptions.getType().getSymbolOrThrow().getDeclarations().find(d => ts_morph_1.Node.isInterfaceDeclaration(d));
        if (!typeDeclaration || !ts_morph_1.Node.isInterfaceDeclaration(typeDeclaration)) {
            return;
        }
        const providersArray = (_a = metadataOptions
            .getProperty('providers')) === null || _a === void 0 ? void 0 : _a.getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression);
        if (!providersArray) {
            return;
        }
        const elements = providersArray.getElements();
        const optionsProviders = elements
            .filter(ts_morph_1.Node.isObjectLiteralExpression)
            .filter(el => { var _a; return (_a = el.getProperty('useFactory')) === null || _a === void 0 ? void 0 : _a.getText().includes(`${this.name}.options`); });
        if (!optionsProviders.length) {
            return;
        }
        const optionsSymbol = optionsProviders[0].getProperty('provide');
        const initializer = optionsSymbol === null || optionsSymbol === void 0 ? void 0 : optionsSymbol.getInitializer();
        if (!initializer || !ts_morph_1.Node.isIdentifier(initializer)) {
            return;
        }
        const constantDeclaration = (_b = initializer.getDefinitions()[0]) === null || _b === void 0 ? void 0 : _b.getDeclarationNode();
        if (!constantDeclaration || !ts_morph_1.Node.isVariableDeclaration(constantDeclaration)) {
            return;
        }
        return { typeDeclaration, constantDeclaration };
    }
    addEntity(entityClassName) {
        const pluginOptions = this.getMetadataOptions();
        const entityProperty = pluginOptions.getProperty('entities');
        if (entityProperty) {
            const entitiesArray = entityProperty.getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression);
            if (entitiesArray) {
                entitiesArray.addElement(entityClassName);
            }
        }
        else {
            pluginOptions.addPropertyAssignment({
                name: 'entities',
                initializer: `[${entityClassName}]`,
            });
        }
    }
    addProvider(providerClassName) {
        const pluginOptions = this.getMetadataOptions();
        const providerProperty = pluginOptions.getProperty('providers');
        if (providerProperty) {
            const providersArray = providerProperty.getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression);
            if (providersArray) {
                providersArray.addElement(providerClassName);
            }
        }
        else {
            pluginOptions.addPropertyAssignment({
                name: 'providers',
                initializer: `[${providerClassName}]`,
            });
        }
    }
    addAdminApiExtensions(extension) {
        var _a, _b;
        const pluginOptions = this.getMetadataOptions();
        const adminApiExtensionsProperty = (_a = pluginOptions
            .getProperty('adminApiExtensions')) === null || _a === void 0 ? void 0 : _a.getType().getSymbolOrThrow().getDeclarations()[0];
        if (extension.schema &&
            adminApiExtensionsProperty &&
            ts_morph_1.Node.isObjectLiteralExpression(adminApiExtensionsProperty)) {
            const schemaProp = adminApiExtensionsProperty.getProperty('schema');
            if (!schemaProp) {
                adminApiExtensionsProperty.addPropertyAssignment({
                    name: 'schema',
                    initializer: (_b = extension.schema) === null || _b === void 0 ? void 0 : _b.getName(),
                });
            }
            const resolversProp = adminApiExtensionsProperty.getProperty('resolvers');
            if (resolversProp) {
                const resolversArray = resolversProp.getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression);
                if (resolversArray) {
                    for (const resolver of extension.resolvers) {
                        const resolverName = resolver.getName();
                        if (resolverName) {
                            resolversArray.addElement(resolverName);
                        }
                    }
                }
            }
            else {
                adminApiExtensionsProperty.addPropertyAssignment({
                    name: 'resolvers',
                    initializer: `[${extension.resolvers.map(r => r.getName()).join(', ')}]`,
                });
            }
        }
        else if (extension.schema) {
            pluginOptions
                .addPropertyAssignment({
                name: 'adminApiExtensions',
                initializer: `{
                        schema: ${extension.schema.getName()},
                        resolvers: [${extension.resolvers.map(r => r.getName()).join(', ')}]
                    }`,
            })
                .formatText();
        }
    }
    getEntities() {
        const metadataOptions = this.getMetadataOptions();
        const entitiesProperty = metadataOptions.getProperty('entities');
        if (!entitiesProperty) {
            return [];
        }
        const entitiesArray = entitiesProperty.getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression);
        if (!entitiesArray) {
            return [];
        }
        const entityNames = entitiesArray
            .getElements()
            .filter(ts_morph_1.Node.isIdentifier)
            .map(e => e.getText());
        const entitySourceFiles = this.getSourceFile()
            .getImportDeclarations()
            .filter(imp => {
            for (const namedImport of imp.getNamedImports()) {
                if (entityNames.includes(namedImport.getName())) {
                    return true;
                }
            }
        })
            .map(imp => imp.getModuleSpecifierSourceFileOrThrow());
        return entitySourceFiles
            .map(sourceFile => sourceFile.getClasses().filter(c => { var _a; return ((_a = c.getExtends()) === null || _a === void 0 ? void 0 : _a.getText()) === 'VendureEntity'; }))
            .flat()
            .map(classDeclaration => new entity_ref_1.EntityRef(classDeclaration));
    }
    hasUiExtensions() {
        return !!this.classDeclaration
            .getStaticProperties()
            .find(prop => { var _a; return ((_a = prop.getType().getSymbol()) === null || _a === void 0 ? void 0 : _a.getName()) === constants_1.AdminUiExtensionTypeName; });
    }
}
exports.VendurePluginRef = VendurePluginRef;
//# sourceMappingURL=vendure-plugin-ref.js.map