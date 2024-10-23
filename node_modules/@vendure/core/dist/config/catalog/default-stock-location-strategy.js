"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultStockLocationStrategy = void 0;
const utils_1 = require("../../common/utils");
const transactional_connection_1 = require("../../connection/transactional-connection");
const allocation_entity_1 = require("../../entity/stock-movement/allocation.entity");
/**
 * @description
 * The DefaultStockLocationStrategy is the default implementation of the {@link StockLocationStrategy}.
 * It assumes only a single StockLocation and that all stock is allocated from that location.
 *
 * @docsCategory products & stock
 * @since 2.0.0
 */
class DefaultStockLocationStrategy {
    init(injector) {
        this.connection = injector.get(transactional_connection_1.TransactionalConnection);
    }
    getAvailableStock(ctx, productVariantId, stockLevels) {
        let stockOnHand = 0;
        let stockAllocated = 0;
        for (const stockLevel of stockLevels) {
            stockOnHand += stockLevel.stockOnHand;
            stockAllocated += stockLevel.stockAllocated;
        }
        return { stockOnHand, stockAllocated };
    }
    forAllocation(ctx, stockLocations, orderLine, quantity) {
        return [{ location: stockLocations[0], quantity }];
    }
    async forCancellation(ctx, stockLocations, orderLine, quantity) {
        return this.getLocationsBasedOnAllocations(ctx, stockLocations, orderLine, quantity);
    }
    async forRelease(ctx, stockLocations, orderLine, quantity) {
        return this.getLocationsBasedOnAllocations(ctx, stockLocations, orderLine, quantity);
    }
    async forSale(ctx, stockLocations, orderLine, quantity) {
        return this.getLocationsBasedOnAllocations(ctx, stockLocations, orderLine, quantity);
    }
    async getLocationsBasedOnAllocations(ctx, stockLocations, orderLine, quantity) {
        const allocations = await this.connection.getRepository(ctx, allocation_entity_1.Allocation).find({
            where: {
                orderLine: { id: orderLine.id },
            },
        });
        let unallocated = quantity;
        const quantityByLocationId = new Map();
        for (const allocation of allocations) {
            if (unallocated <= 0) {
                break;
            }
            const qtyAtLocation = quantityByLocationId.get(allocation.stockLocationId);
            const qtyToAdd = Math.min(allocation.quantity, unallocated);
            if (qtyAtLocation != null) {
                quantityByLocationId.set(allocation.stockLocationId, qtyAtLocation + qtyToAdd);
            }
            else {
                quantityByLocationId.set(allocation.stockLocationId, qtyToAdd);
            }
            unallocated -= qtyToAdd;
        }
        return [...quantityByLocationId.entries()].map(([locationId, qty]) => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            location: stockLocations.find(l => (0, utils_1.idsAreEqual)(l.id, locationId)),
            quantity: qty,
        }));
    }
}
exports.DefaultStockLocationStrategy = DefaultStockLocationStrategy;
//# sourceMappingURL=default-stock-location-strategy.js.map