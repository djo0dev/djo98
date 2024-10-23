"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInspectableJobQueueStrategy = void 0;
function isInspectableJobQueueStrategy(strategy) {
    return (strategy.findOne !== undefined &&
        strategy.findMany !== undefined &&
        strategy.findManyById !== undefined &&
        strategy.removeSettledJobs !== undefined);
}
exports.isInspectableJobQueueStrategy = isInspectableJobQueueStrategy;
//# sourceMappingURL=inspectable-job-queue-strategy.js.map