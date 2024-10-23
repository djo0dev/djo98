"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = exports.AdminUiAppConfigName = exports.AdminUiExtensionTypeName = exports.pascalCaseRegex = exports.defaultManipulationSettings = void 0;
const ts_morph_1 = require("ts-morph");
exports.defaultManipulationSettings = {
    quoteKind: ts_morph_1.QuoteKind.Single,
    useTrailingCommas: true,
};
exports.pascalCaseRegex = /^[A-Z][a-zA-Z0-9]*$/;
exports.AdminUiExtensionTypeName = 'AdminUiExtension';
exports.AdminUiAppConfigName = 'AdminUiAppConfig';
exports.Messages = {
    NoPluginsFound: `No plugins were found in this project. Create a plugin first by selecting "[Plugin] Create a new Vendure plugin"`,
    NoEntitiesFound: `No entities were found in this plugin.`,
    NoServicesFound: `No services were found in this plugin. Create a service first by selecting "[Plugin: Service] Add a new service to a plugin"`,
};
//# sourceMappingURL=constants.js.map