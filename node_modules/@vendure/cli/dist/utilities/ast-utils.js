"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customizeCreateUpdateInputInterfaces = exports.createFile = exports.getRelativeImportPath = exports.addImportsToFile = exports.getPluginClasses = exports.getTsMorphProject = exports.selectTsConfigFile = void 0;
const prompts_1 = require("@clack/prompts");
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_path_1 = __importDefault(require("node:path"));
const ts_morph_1 = require("ts-morph");
const constants_1 = require("../constants");
async function selectTsConfigFile() {
    const tsConfigFiles = fs_extra_1.default.readdirSync(process.cwd()).filter(f => /^tsconfig.*\.json$/.test(f));
    if (tsConfigFiles.length === 0) {
        throw new Error('No tsconfig files found in current directory');
    }
    if (tsConfigFiles.length === 1) {
        return tsConfigFiles[0];
    }
    const selectedConfigFile = await (0, prompts_1.select)({
        message: 'Multiple tsconfig files found. Select one:',
        options: tsConfigFiles.map(c => ({
            value: c,
            label: node_path_1.default.basename(c),
        })),
        maxItems: 10,
    });
    if ((0, prompts_1.isCancel)(selectedConfigFile)) {
        (0, prompts_1.cancel)();
        process.exit(0);
    }
    return selectedConfigFile;
}
exports.selectTsConfigFile = selectTsConfigFile;
async function getTsMorphProject(options = {}, providedTsConfigPath) {
    const tsConfigFile = providedTsConfigPath !== null && providedTsConfigPath !== void 0 ? providedTsConfigPath : (await selectTsConfigFile());
    const tsConfigPath = node_path_1.default.join(process.cwd(), tsConfigFile);
    if (!fs_extra_1.default.existsSync(tsConfigPath)) {
        throw new Error('No tsconfig.json found in current directory');
    }
    const project = new ts_morph_1.Project(Object.assign({ tsConfigFilePath: tsConfigPath, manipulationSettings: constants_1.defaultManipulationSettings, compilerOptions: {
            skipLibCheck: true,
        } }, options));
    project.enableLogging(false);
    return { project, tsConfigPath };
}
exports.getTsMorphProject = getTsMorphProject;
function getPluginClasses(project) {
    const sourceFiles = project.getSourceFiles();
    const pluginClasses = sourceFiles
        .flatMap(sf => {
        return sf.getClasses();
    })
        .filter(c => {
        const hasPluginDecorator = c.getModifiers().find(m => {
            return ts_morph_1.Node.isDecorator(m) && m.getName() === 'VendurePlugin';
        });
        return !!hasPluginDecorator;
    });
    return pluginClasses;
}
exports.getPluginClasses = getPluginClasses;
function addImportsToFile(sourceFile, options) {
    const moduleSpecifier = getModuleSpecifierString(options.moduleSpecifier, sourceFile);
    const existingDeclaration = sourceFile.getImportDeclaration(declaration => declaration.getModuleSpecifier().getLiteralValue() === moduleSpecifier);
    if (!existingDeclaration) {
        const importDeclaration = sourceFile.addImportDeclaration(Object.assign(Object.assign({ moduleSpecifier }, (options.namespaceImport ? { namespaceImport: options.namespaceImport } : {})), (options.namedImports ? { namedImports: options.namedImports } : {})));
        if (options.order != null) {
            importDeclaration.setOrder(options.order);
        }
    }
    else {
        if (options.namespaceImport &&
            !existingDeclaration.getNamespaceImport() &&
            !existingDeclaration.getDefaultImport()) {
            existingDeclaration.setNamespaceImport(options.namespaceImport);
        }
        if (options.namedImports) {
            const existingNamedImports = existingDeclaration.getNamedImports();
            for (const namedImport of options.namedImports) {
                if (!existingNamedImports.find(ni => ni.getName() === namedImport)) {
                    existingDeclaration.addNamedImport(namedImport);
                }
            }
        }
    }
}
exports.addImportsToFile = addImportsToFile;
function getModuleSpecifierString(moduleSpecifier, sourceFile) {
    if (typeof moduleSpecifier === 'string') {
        return moduleSpecifier;
    }
    return getRelativeImportPath({ from: sourceFile, to: moduleSpecifier });
}
function getRelativeImportPath(locations) {
    const fromPath = locations.from instanceof ts_morph_1.SourceFile ? locations.from.getFilePath() : locations.from.getPath();
    const toPath = locations.to instanceof ts_morph_1.SourceFile ? locations.to.getFilePath() : locations.to.getPath();
    const fromDir = /\.[a-z]+$/.test(fromPath) ? node_path_1.default.dirname(fromPath) : fromPath;
    return convertPathToRelativeImport(node_path_1.default.relative(fromDir, toPath));
}
exports.getRelativeImportPath = getRelativeImportPath;
function createFile(project, templatePath, filePath) {
    const template = fs_extra_1.default.readFileSync(templatePath, 'utf-8');
    try {
        const file = project.createSourceFile(filePath, template, {
            overwrite: true,
            scriptKind: ts_morph_1.ScriptKind.TS,
        });
        project.resolveSourceFileDependencies();
        return file;
    }
    catch (e) {
        prompts_1.log.error(e.message);
        process.exit(1);
    }
}
exports.createFile = createFile;
function convertPathToRelativeImport(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const parsedPath = node_path_1.default.parse(normalizedPath);
    const prefix = parsedPath.dir.startsWith('..') ? '' : './';
    return `${prefix}${parsedPath.dir}/${parsedPath.name}`.replace(/\/\//g, '/');
}
function customizeCreateUpdateInputInterfaces(sourceFile, entityRef) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const createInputInterface = (_a = sourceFile
        .getInterface('CreateEntityInput')) === null || _a === void 0 ? void 0 : _a.rename(`Create${entityRef.name}Input`);
    const updateInputInterface = (_b = sourceFile
        .getInterface('UpdateEntityInput')) === null || _b === void 0 ? void 0 : _b.rename(`Update${entityRef.name}Input`);
    let index = 0;
    for (const { name, type, nullable } of entityRef.getProps()) {
        if (type.isBoolean() ||
            type.isString() ||
            type.isNumber() ||
            (type.isObject() && type.getText() === 'Date')) {
            createInputInterface === null || createInputInterface === void 0 ? void 0 : createInputInterface.insertProperty(index, {
                name,
                type: writer => writer.write(type.getText()),
                hasQuestionToken: nullable,
            });
            updateInputInterface === null || updateInputInterface === void 0 ? void 0 : updateInputInterface.insertProperty(index + 1, {
                name,
                type: writer => writer.write(type.getText()),
                hasQuestionToken: true,
            });
            index++;
        }
    }
    if (!entityRef.hasCustomFields()) {
        (_c = createInputInterface === null || createInputInterface === void 0 ? void 0 : createInputInterface.getProperty('customFields')) === null || _c === void 0 ? void 0 : _c.remove();
        (_d = updateInputInterface === null || updateInputInterface === void 0 ? void 0 : updateInputInterface.getProperty('customFields')) === null || _d === void 0 ? void 0 : _d.remove();
    }
    if (entityRef.isTranslatable()) {
        (_e = createInputInterface === null || createInputInterface === void 0 ? void 0 : createInputInterface.getProperty('translations')) === null || _e === void 0 ? void 0 : _e.setType(`Array<TranslationInput<${entityRef.name}>>`);
        (_f = updateInputInterface === null || updateInputInterface === void 0 ? void 0 : updateInputInterface.getProperty('translations')) === null || _f === void 0 ? void 0 : _f.setType(`Array<TranslationInput<${entityRef.name}>>`);
    }
    else {
        (_g = createInputInterface === null || createInputInterface === void 0 ? void 0 : createInputInterface.getProperty('translations')) === null || _g === void 0 ? void 0 : _g.remove();
        (_h = updateInputInterface === null || updateInputInterface === void 0 ? void 0 : updateInputInterface.getProperty('translations')) === null || _h === void 0 ? void 0 : _h.remove();
    }
}
exports.customizeCreateUpdateInputInterfaces = customizeCreateUpdateInputInterfaces;
//# sourceMappingURL=ast-utils.js.map