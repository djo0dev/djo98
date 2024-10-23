"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultTaxZoneStrategy = void 0;
/**
 * @description
 * A default method of determining Zone for tax calculations.
 *
 * @docsCategory tax
 */
class DefaultTaxZoneStrategy {
    determineTaxZone(ctx, zones, channel, order) {
        return channel.defaultTaxZone;
    }
}
exports.DefaultTaxZoneStrategy = DefaultTaxZoneStrategy;
//# sourceMappingURL=default-tax-zone-strategy.js.map