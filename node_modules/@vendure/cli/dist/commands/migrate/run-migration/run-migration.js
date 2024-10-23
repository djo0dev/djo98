"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrationCommand = void 0;
const prompts_1 = require("@clack/prompts");
const core_1 = require("@vendure/core");
const cli_command_1 = require("../../../shared/cli-command");
const shared_prompts_1 = require("../../../shared/shared-prompts");
const vendure_config_ref_1 = require("../../../shared/vendure-config-ref");
const load_vendure_config_file_1 = require("../load-vendure-config-file");
const cancelledMessage = 'Run migrations cancelled';
exports.runMigrationCommand = new cli_command_1.CliCommand({
    id: 'run-migration',
    category: 'Other',
    description: 'Run any pending database migrations',
    run: () => runRunMigration(),
});
async function runRunMigration() {
    const { project } = await (0, shared_prompts_1.analyzeProject)({ cancelledMessage });
    const vendureConfig = new vendure_config_ref_1.VendureConfigRef(project);
    prompts_1.log.info('Using VendureConfig from ' + vendureConfig.getPathRelativeToProjectRoot());
    const config = await (0, load_vendure_config_file_1.loadVendureConfigFile)(vendureConfig);
    const runSpinner = (0, prompts_1.spinner)();
    runSpinner.start('Running migrations...');
    const migrationsRan = await (0, core_1.runMigrations)(config);
    const report = migrationsRan.length
        ? `Successfully ran ${migrationsRan.length} migrations`
        : 'No pending migrations found';
    runSpinner.stop(report);
    return {
        project,
        modifiedSourceFiles: [],
    };
}
//# sourceMappingURL=run-migration.js.map