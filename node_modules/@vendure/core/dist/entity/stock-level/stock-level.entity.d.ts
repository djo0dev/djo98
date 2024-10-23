import { DeepPartial, ID } from '@vendure/common/lib/shared-types';
import { VendureEntity } from '../base/base.entity';
import { ProductVariant } from '../product-variant/product-variant.entity';
import { StockLocation } from '../stock-location/stock-location.entity';
/**
 * @description
 * A StockLevel represents the number of a particular {@link ProductVariant} which are available
 * at a particular {@link StockLocation}.
 *
 * @docsCategory entities
 */
export declare class StockLevel extends VendureEntity {
    constructor(input: DeepPartial<StockLevel>);
    productVariant: ProductVariant;
    productVariantId: ID;
    stockLocation: StockLocation;
    stockLocationId: ID;
    stockOnHand: number;
    stockAllocated: number;
}
