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
exports.loadVendureConfigFile = void 0;
const node_path_1 = __importDefault(require("node:path"));
const ts_node_1 = require("ts-node");
const ast_utils_1 = require("../../utilities/ast-utils");
const utils_1 = require("../../utilities/utils");
async function loadVendureConfigFile(vendureConfig, providedTsConfigPath) {
    await Promise.resolve().then(() => __importStar(require('dotenv/config')));
    if (!(0, utils_1.isRunningInTsNode)()) {
        let tsConfigPath;
        if (providedTsConfigPath) {
            tsConfigPath = providedTsConfigPath;
        }
        else {
            const tsConfigFile = await (0, ast_utils_1.selectTsConfigFile)();
            tsConfigPath = node_path_1.default.join(process.cwd(), tsConfigFile);
        }
        const compilerOptions = require(tsConfigPath).compilerOptions;
        (0, ts_node_1.register)({
            compilerOptions: Object.assign(Object.assign({}, compilerOptions), { moduleResolution: 'NodeNext', module: 'NodeNext' }),
            transpileOnly: true,
        });
        if (compilerOptions.paths) {
            const tsConfigPaths = require('tsconfig-paths');
            tsConfigPaths.register({
                baseUrl: './',
                paths: compilerOptions.paths,
            });
        }
    }
    const exportedVarName = vendureConfig.getConfigObjectVariableName();
    if (!exportedVarName) {
        throw new Error('Could not find the exported variable name in the VendureConfig file');
    }
    const config = require(vendureConfig.sourceFile.getFilePath())[exportedVarName];
    return config;
}
exports.loadVendureConfigFile = loadVendureConfigFile;
//# sourceMappingURL=load-vendure-config-file.js.map