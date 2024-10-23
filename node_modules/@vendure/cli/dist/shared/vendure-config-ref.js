"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendureConfigRef = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_path_1 = __importDefault(require("node:path"));
const ts_morph_1 = require("ts-morph");
class VendureConfigRef {
    constructor(project, options = {}) {
        var _a, _b;
        this.project = project;
        const checkFileName = (_a = options.checkFileName) !== null && _a !== void 0 ? _a : true;
        const getVendureConfigSourceFile = (sourceFiles) => {
            return sourceFiles.find(sf => {
                return ((checkFileName ? sf.getFilePath().endsWith('vendure-config.ts') : true) &&
                    sf.getVariableDeclarations().find(v => this.isVendureConfigVariableDeclaration(v)));
            });
        };
        const findAndAddVendureConfigToProject = () => {
            const srcDir = project.getDirectory('src');
            if (srcDir) {
                const srcDirPath = srcDir.getPath();
                const srcFiles = fs_extra_1.default.readdirSync(srcDirPath);
                const filePath = srcFiles.find(file => file.includes('vendure-config.ts'));
                if (filePath) {
                    project.addSourceFileAtPath(node_path_1.default.join(srcDirPath, filePath));
                }
            }
        };
        let vendureConfigFile = getVendureConfigSourceFile(project.getSourceFiles());
        if (!vendureConfigFile) {
            findAndAddVendureConfigToProject();
            vendureConfigFile = getVendureConfigSourceFile(project.getSourceFiles());
        }
        if (!vendureConfigFile) {
            throw new Error('Could not find the VendureConfig declaration in your project.');
        }
        this.sourceFile = vendureConfigFile;
        this.configObject = (_b = vendureConfigFile === null || vendureConfigFile === void 0 ? void 0 : vendureConfigFile.getVariableDeclarations().find(v => this.isVendureConfigVariableDeclaration(v))) === null || _b === void 0 ? void 0 : _b.getChildren().find(ts_morph_1.Node.isObjectLiteralExpression);
    }
    getPathRelativeToProjectRoot() {
        var _a, _b;
        return node_path_1.default.relative((_b = (_a = this.project.getRootDirectories()[0]) === null || _a === void 0 ? void 0 : _a.getPath()) !== null && _b !== void 0 ? _b : '', this.sourceFile.getFilePath());
    }
    getConfigObjectVariableName() {
        var _a, _b;
        return (_b = (_a = this.sourceFile) === null || _a === void 0 ? void 0 : _a.getVariableDeclarations().find(v => this.isVendureConfigVariableDeclaration(v))) === null || _b === void 0 ? void 0 : _b.getName();
    }
    getPluginsArray() {
        var _a;
        return (_a = this.configObject
            .getProperty('plugins')) === null || _a === void 0 ? void 0 : _a.getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression);
    }
    addToPluginsArray(text) {
        var _a;
        (_a = this.getPluginsArray()) === null || _a === void 0 ? void 0 : _a.addElement(text).formatText();
    }
    isVendureConfigVariableDeclaration(v) {
        return v.getType().getText(v) === 'VendureConfig';
    }
}
exports.VendureConfigRef = VendureConfigRef;
//# sourceMappingURL=vendure-config-ref.js.map