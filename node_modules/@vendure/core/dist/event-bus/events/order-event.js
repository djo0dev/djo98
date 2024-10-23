"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderEvent = void 0;
const vendure_event_1 = require("../vendure-event");
/**
 * @description
 * This event is fired whenever an {@link Order} is added, updated
 * or deleted.
 *
 * @docsCategory events
 * @docsPage Event Types
 */
class OrderEvent extends vendure_event_1.VendureEvent {
    constructor(ctx, order, type) {
        super();
        this.ctx = ctx;
        this.order = order;
        this.type = type;
    }
}
exports.OrderEvent = OrderEvent;
//# sourceMappingURL=order-event.js.map