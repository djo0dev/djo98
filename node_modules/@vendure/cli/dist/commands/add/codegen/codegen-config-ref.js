"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodegenConfigRef = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ts_morph_1 = require("ts-morph");
const ast_utils_1 = require("../../../utilities/ast-utils");
class CodegenConfigRef {
    constructor(project, rootDir) {
        this.project = project;
        const codegenFilePath = path_1.default.join(rootDir.getPath(), 'codegen.ts');
        if (fs_extra_1.default.existsSync(codegenFilePath)) {
            this.sourceFile = this.project.addSourceFileAtPath(codegenFilePath);
        }
        else {
            this.sourceFile = (0, ast_utils_1.createFile)(this.project, path_1.default.join(__dirname, 'templates/codegen.template.ts'), path_1.default.join(rootDir.getPath(), 'codegen.ts'));
        }
    }
    addEntryToGeneratesObject(structure) {
        var _a;
        const generatesProp = (_a = this.getConfigObject()
            .getProperty('generates')) === null || _a === void 0 ? void 0 : _a.getFirstChildByKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression);
        if (!generatesProp) {
            throw new Error('Could not find the generates property in the template codegen file');
        }
        if (generatesProp.getProperty(structure.name)) {
            return;
        }
        generatesProp.addProperty(structure).formatText();
    }
    getConfigObject() {
        var _a;
        if (this.configObject) {
            return this.configObject;
        }
        const codegenConfig = (_a = this.sourceFile
            .getVariableDeclaration('config')) === null || _a === void 0 ? void 0 : _a.getChildrenOfKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression)[0];
        if (!codegenConfig) {
            throw new Error('Could not find the config variable in the template codegen file');
        }
        this.configObject = codegenConfig;
        return this.configObject;
    }
    save() {
        return this.project.save();
    }
}
exports.CodegenConfigRef = CodegenConfigRef;
//# sourceMappingURL=codegen-config-ref.js.map