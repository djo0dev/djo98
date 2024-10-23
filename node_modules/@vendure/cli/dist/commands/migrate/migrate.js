"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCommand = void 0;
const prompts_1 = require("@clack/prompts");
const picocolors_1 = __importDefault(require("picocolors"));
const generate_migration_1 = require("./generate-migration/generate-migration");
const revert_migration_1 = require("./revert-migration/revert-migration");
const run_migration_1 = require("./run-migration/run-migration");
const cancelledMessage = 'Migrate cancelled.';
async function migrateCommand() {
    console.log(`\n`);
    (0, prompts_1.intro)(picocolors_1.default.blue('🛠️️ Vendure migrations'));
    const action = await (0, prompts_1.select)({
        message: 'What would you like to do?',
        options: [
            { value: 'generate', label: 'Generate a new migration' },
            { value: 'run', label: 'Run pending migrations' },
            { value: 'revert', label: 'Revert the last migration' },
        ],
    });
    if ((0, prompts_1.isCancel)(action)) {
        (0, prompts_1.cancel)(cancelledMessage);
        process.exit(0);
    }
    try {
        process.env.VENDURE_RUNNING_IN_CLI = 'true';
        if (action === 'generate') {
            await generate_migration_1.generateMigrationCommand.run();
        }
        if (action === 'run') {
            await run_migration_1.runMigrationCommand.run();
        }
        if (action === 'revert') {
            await revert_migration_1.revertMigrationCommand.run();
        }
        (0, prompts_1.outro)('✅ Done!');
        process.env.VENDURE_RUNNING_IN_CLI = undefined;
    }
    catch (e) {
        prompts_1.log.error(e.message);
        if (e.stack) {
            prompts_1.log.error(e.stack);
        }
    }
}
exports.migrateCommand = migrateCommand;
//# sourceMappingURL=migrate.js.map