import { IBaseFilterQuery } from './base.types';

export interface IOrderFilterQuery extends IBaseFilterQuery {
    fromDeliveryTime: string;
    toDeliveryTime: string;
    fromEscrowTime: string;
    toEscrowTime: string;
    status: string;
}
