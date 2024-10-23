"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addJobQueueCommand = void 0;
const prompts_1 = require("@clack/prompts");
const change_case_1 = require("change-case");
const ts_morph_1 = require("ts-morph");
const cli_command_1 = require("../../../shared/cli-command");
const shared_prompts_1 = require("../../../shared/shared-prompts");
const ast_utils_1 = require("../../../utilities/ast-utils");
const cancelledMessage = 'Add API extension cancelled';
exports.addJobQueueCommand = new cli_command_1.CliCommand({
    id: 'add-job-queue',
    category: 'Plugin: Job Queue',
    description: 'Defines an new job queue on a service',
    run: options => addJobQueue(options),
});
async function addJobQueue(options) {
    var _a;
    const providedVendurePlugin = options === null || options === void 0 ? void 0 : options.plugin;
    const { project } = await (0, shared_prompts_1.analyzeProject)({ providedVendurePlugin, cancelledMessage });
    const plugin = providedVendurePlugin !== null && providedVendurePlugin !== void 0 ? providedVendurePlugin : (await (0, shared_prompts_1.selectPlugin)(project, cancelledMessage));
    const serviceRef = await (0, shared_prompts_1.selectServiceRef)(project, plugin);
    const jobQueueName = await (0, prompts_1.text)({
        message: 'What is the name of the job queue?',
        initialValue: 'my-background-task',
        validate: input => {
            if (!/^[a-z][a-z-0-9]+$/.test(input)) {
                return 'The job queue name must be lowercase and contain only letters, numbers and dashes';
            }
        },
    });
    if ((0, prompts_1.isCancel)(jobQueueName)) {
        (0, prompts_1.cancel)(cancelledMessage);
        process.exit(0);
    }
    (0, ast_utils_1.addImportsToFile)(serviceRef.classDeclaration.getSourceFile(), {
        moduleSpecifier: '@vendure/core',
        namedImports: ['JobQueue', 'JobQueueService', 'SerializedRequestContext'],
    });
    (0, ast_utils_1.addImportsToFile)(serviceRef.classDeclaration.getSourceFile(), {
        moduleSpecifier: '@vendure/common/lib/generated-types',
        namedImports: ['JobState'],
    });
    (0, ast_utils_1.addImportsToFile)(serviceRef.classDeclaration.getSourceFile(), {
        moduleSpecifier: '@nestjs/common',
        namedImports: ['OnModuleInit'],
    });
    serviceRef.injectDependency({
        name: 'jobQueueService',
        type: 'JobQueueService',
    });
    const jobQueuePropertyName = (0, change_case_1.camelCase)(jobQueueName) + 'Queue';
    serviceRef.classDeclaration.insertProperty(0, {
        name: jobQueuePropertyName,
        scope: ts_morph_1.Scope.Private,
        type: writer => writer.write('JobQueue<{ ctx: SerializedRequestContext, someArg: string; }>'),
    });
    serviceRef.classDeclaration.addImplements('OnModuleInit');
    let onModuleInitMethod = serviceRef.classDeclaration.getMethod('onModuleInit');
    if (!onModuleInitMethod) {
        const constructor = serviceRef.classDeclaration.getConstructors()[0];
        const constructorChildIndex = (_a = constructor === null || constructor === void 0 ? void 0 : constructor.getChildIndex()) !== null && _a !== void 0 ? _a : 0;
        onModuleInitMethod = serviceRef.classDeclaration.insertMethod(constructorChildIndex + 1, {
            name: 'onModuleInit',
            isAsync: false,
            returnType: 'void',
            scope: ts_morph_1.Scope.Public,
        });
    }
    onModuleInitMethod.setIsAsync(true);
    onModuleInitMethod.setReturnType('Promise<void>');
    const body = onModuleInitMethod.getBody();
    if (ts_morph_1.Node.isBlock(body)) {
        body.addStatements(writer => {
            writer
                .write(`this.${jobQueuePropertyName} = await this.jobQueueService.createQueue({
                name: '${jobQueueName}',
                process: async job => {
                    // Deserialize the RequestContext from the job data
                    const ctx = RequestContext.deserialize(job.data.ctx);
                    // The "someArg" property is passed in when the job is triggered
                    const someArg = job.data.someArg;

                    // Inside the \`process\` function we define how each job
                    // in the queue will be processed.
                    // Let's simulate some long-running task
                    const totalItems = 10;
                    for (let i = 0; i < totalItems; i++) {
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // You can optionally respond to the job being cancelled
                        // during processing. This can be useful for very long-running
                        // tasks which can be cancelled by the user.
                        if (job.state === JobState.CANCELLED) {
                            throw new Error('Job was cancelled');
                        }

                        // Progress can be reported as a percentage like this
                        job.setProgress(Math.floor(i / totalItems * 100));
                    }

                    // The value returned from the \`process\` function is stored
                    // as the "result" field of the job
                    return {
                        processedCount: totalItems,
                        message: \`Successfully processed \${totalItems} items\`,
                    };
                },
            })`)
                .newLine();
        }).forEach(s => s.formatText());
    }
    serviceRef.classDeclaration
        .addMethod({
        name: `trigger${(0, change_case_1.pascalCase)(jobQueueName)}`,
        scope: ts_morph_1.Scope.Public,
        parameters: [{ name: 'ctx', type: 'RequestContext' }],
        statements: writer => {
            writer.write(`return this.${jobQueuePropertyName}.add({
                ctx: ctx.serialize(),
                someArg: 'foo',
            })`);
        },
    })
        .formatText();
    prompts_1.log.success(`New job queue created in ${serviceRef.name}`);
    await project.save();
    return { project, modifiedSourceFiles: [serviceRef.classDeclaration.getSourceFile()], serviceRef };
}
//# sourceMappingURL=add-job-queue.js.map