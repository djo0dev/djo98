"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliCommand = void 0;
class CliCommand {
    constructor(options) {
        this.options = options;
    }
    get id() {
        return this.options.id;
    }
    get category() {
        return this.options.category;
    }
    get description() {
        return this.options.description;
    }
    run(options) {
        return this.options.run(options);
    }
}
exports.CliCommand = CliCommand;
//# sourceMappingURL=cli-command.js.map