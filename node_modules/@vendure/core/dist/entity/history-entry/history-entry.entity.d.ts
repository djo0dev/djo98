import { HistoryEntryType } from '@vendure/common/lib/generated-types';
import { Administrator } from '../administrator/administrator.entity';
import { VendureEntity } from '../base/base.entity';
/**
 * @description
 * An abstract entity representing an entry in the history of an Order ({@link OrderHistoryEntry})
 * or a Customer ({@link CustomerHistoryEntry}).
 *
 * @docsCategory entities
 */
export declare abstract class HistoryEntry extends VendureEntity {
    administrator?: Administrator;
    readonly type: HistoryEntryType;
    isPublic: boolean;
    data: any;
}
