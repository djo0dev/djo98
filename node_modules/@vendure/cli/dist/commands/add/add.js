"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommand = void 0;
const prompts_1 = require("@clack/prompts");
const picocolors_1 = __importDefault(require("picocolors"));
const constants_1 = require("../../constants");
const utils_1 = require("../../utilities/utils");
const add_api_extension_1 = require("./api-extension/add-api-extension");
const add_codegen_1 = require("./codegen/add-codegen");
const add_entity_1 = require("./entity/add-entity");
const add_job_queue_1 = require("./job-queue/add-job-queue");
const create_new_plugin_1 = require("./plugin/create-new-plugin");
const add_service_1 = require("./service/add-service");
const add_ui_extensions_1 = require("./ui-extensions/add-ui-extensions");
const cancelledMessage = 'Add feature cancelled.';
async function addCommand() {
    console.log(`\n`);
    (0, prompts_1.intro)(picocolors_1.default.blue("✨ Let's add a new feature to your Vendure project!"));
    const addCommands = [
        create_new_plugin_1.createNewPluginCommand,
        add_entity_1.addEntityCommand,
        add_service_1.addServiceCommand,
        add_api_extension_1.addApiExtensionCommand,
        add_job_queue_1.addJobQueueCommand,
        add_ui_extensions_1.addUiExtensionsCommand,
        add_codegen_1.addCodegenCommand,
    ];
    const featureType = await (0, prompts_1.select)({
        message: 'Which feature would you like to add?',
        options: addCommands.map(c => ({
            value: c.id,
            label: `${picocolors_1.default.blue(`${c.category}`)} ${c.description}`,
        })),
    });
    if ((0, prompts_1.isCancel)(featureType)) {
        (0, prompts_1.cancel)(cancelledMessage);
        process.exit(0);
    }
    try {
        const command = addCommands.find(c => c.id === featureType);
        if (!command) {
            throw new Error(`Could not find command with id "${featureType}"`);
        }
        const { modifiedSourceFiles, project } = await command.run();
        if (modifiedSourceFiles.length) {
            const importsSpinner = (0, prompts_1.spinner)();
            importsSpinner.start('Organizing imports...');
            await (0, utils_1.pauseForPromptDisplay)();
            for (const sourceFile of modifiedSourceFiles) {
                sourceFile.organizeImports();
            }
            await project.save();
            importsSpinner.stop('Imports organized');
        }
        (0, prompts_1.outro)('✅ Done!');
    }
    catch (e) {
        prompts_1.log.error(e.message);
        const isCliMessage = Object.values(constants_1.Messages).includes(e.message);
        if (!isCliMessage && e.stack) {
            prompts_1.log.error(e.stack);
        }
        (0, prompts_1.outro)('❌ Error');
    }
}
exports.addCommand = addCommand;
//# sourceMappingURL=add.js.map