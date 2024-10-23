"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRunningInTsNode = exports.pauseForPromptDisplay = void 0;
async function pauseForPromptDisplay() {
    await new Promise(resolve => setTimeout(resolve, 100));
}
exports.pauseForPromptDisplay = pauseForPromptDisplay;
function isRunningInTsNode() {
    return process[Symbol.for('ts-node.register.instance')] != null;
}
exports.isRunningInTsNode = isRunningInTsNode;
//# sourceMappingURL=utils.js.map