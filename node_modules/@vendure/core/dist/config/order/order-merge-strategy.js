"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMergedOrderLine = void 0;
function toMergedOrderLine(line) {
    return {
        orderLineId: line.id,
        quantity: line.quantity,
        customFields: line.customFields,
    };
}
exports.toMergedOrderLine = toMergedOrderLine;
//# sourceMappingURL=order-merge-strategy.js.map