import { DeepPartial } from '@vendure/common/lib/shared-types';
import { PaymentMetadata } from '../../common/types/common-types';
import { PaymentState } from '../../service/helpers/payment-state-machine/payment-state';
import { VendureEntity } from '../base/base.entity';
import { Order } from '../order/order.entity';
import { Refund } from '../refund/refund.entity';
/**
 * @description
 * A Payment represents a single payment transaction and exists in a well-defined state
 * defined by the {@link PaymentState} type.
 *
 * @docsCategory entities
 */
export declare class Payment extends VendureEntity {
    constructor(input?: DeepPartial<Payment>);
    method: string;
    amount: number;
    state: PaymentState;
    errorMessage: string | undefined;
    transactionId: string;
    metadata: PaymentMetadata;
    order: Order;
    refunds: Refund[];
}
