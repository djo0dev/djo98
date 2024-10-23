"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMigrationCommand = void 0;
const prompts_1 = require("@clack/prompts");
const unique_1 = require("@vendure/common/lib/unique");
const core_1 = require("@vendure/core");
const path_1 = __importDefault(require("path"));
const cli_command_1 = require("../../../shared/cli-command");
const shared_prompts_1 = require("../../../shared/shared-prompts");
const vendure_config_ref_1 = require("../../../shared/vendure-config-ref");
const load_vendure_config_file_1 = require("../load-vendure-config-file");
const cancelledMessage = 'Generate migration cancelled';
exports.generateMigrationCommand = new cli_command_1.CliCommand({
    id: 'generate-migration',
    category: 'Other',
    description: 'Generate a new database migration',
    run: () => runGenerateMigration(),
});
async function runGenerateMigration() {
    const { project, tsConfigPath } = await (0, shared_prompts_1.analyzeProject)({ cancelledMessage });
    const vendureConfig = new vendure_config_ref_1.VendureConfigRef(project);
    prompts_1.log.info('Using VendureConfig from ' + vendureConfig.getPathRelativeToProjectRoot());
    const name = await (0, prompts_1.text)({
        message: 'Enter a meaningful name for the migration',
        initialValue: '',
        placeholder: 'add-custom-fields',
        validate: input => {
            if (!/^[a-zA-Z][a-zA-Z-_0-9]+$/.test(input)) {
                return 'The plugin name must contain only letters, numbers, underscores and dashes';
            }
        },
    });
    if ((0, prompts_1.isCancel)(name)) {
        (0, prompts_1.cancel)(cancelledMessage);
        process.exit(0);
    }
    const config = await (0, load_vendure_config_file_1.loadVendureConfigFile)(vendureConfig, tsConfigPath);
    const migrationsDirs = getMigrationsDir(vendureConfig, config);
    let migrationDir = migrationsDirs[0];
    if (migrationsDirs.length > 1) {
        const migrationDirSelect = await (0, prompts_1.select)({
            message: 'Migration file location',
            options: migrationsDirs
                .map(c => ({
                value: c,
                label: c,
            }))
                .concat({
                value: 'other',
                label: 'Other',
            }),
        });
        if ((0, prompts_1.isCancel)(migrationDirSelect)) {
            (0, prompts_1.cancel)(cancelledMessage);
            process.exit(0);
        }
        migrationDir = migrationDirSelect;
    }
    if (migrationsDirs.length === 1 || migrationDir === 'other') {
        const confirmation = await (0, prompts_1.text)({
            message: 'Migration file location',
            initialValue: migrationsDirs[0],
            placeholder: '',
        });
        if ((0, prompts_1.isCancel)(confirmation)) {
            (0, prompts_1.cancel)(cancelledMessage);
            process.exit(0);
        }
        migrationDir = confirmation;
    }
    const migrationSpinner = (0, prompts_1.spinner)();
    migrationSpinner.start('Generating migration...');
    const migrationName = await (0, core_1.generateMigration)(config, { name, outputDir: migrationDir });
    const report = typeof migrationName === 'string'
        ? `New migration generated: ${migrationName}`
        : 'No changes in database schema were found, so no migration was generated';
    migrationSpinner.stop(report);
    return {
        project,
        modifiedSourceFiles: [],
    };
}
function getMigrationsDir(vendureConfigRef, config) {
    const options = [];
    if (Array.isArray(config.dbConnectionOptions.migrations) &&
        config.dbConnectionOptions.migrations.length) {
        const firstEntry = config.dbConnectionOptions.migrations[0];
        if (typeof firstEntry === 'string') {
            options.push(path_1.default.dirname(firstEntry));
        }
    }
    const migrationFile = vendureConfigRef.sourceFile
        .getProject()
        .getSourceFiles()
        .find(sf => {
        return sf
            .getClasses()
            .find(c => c.getImplements().find(i => i.getText() === 'MigrationInterface'));
    });
    if (migrationFile) {
        options.push(migrationFile.getDirectory().getPath());
    }
    options.push(path_1.default.join(vendureConfigRef.sourceFile.getDirectory().getPath(), '../migrations'));
    return (0, unique_1.unique)(options.map(p => path_1.default.normalize(p)));
}
//# sourceMappingURL=generate-migration.js.map