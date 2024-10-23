import { RequestContext } from '../../api/common/request-context';
import { Order } from '../../entity';
import { VendureEvent } from '../vendure-event';
/**
 * @description
 * This event is fired whenever an {@link Order} is added, updated
 * or deleted.
 *
 * @docsCategory events
 * @docsPage Event Types
 */
export declare class OrderEvent extends VendureEvent {
    ctx: RequestContext;
    order: Order;
    type: 'created' | 'updated' | 'deleted';
    constructor(ctx: RequestContext, order: Order, type: 'created' | 'updated' | 'deleted');
}
