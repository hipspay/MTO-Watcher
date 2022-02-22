import { IBaseFilterQuery } from './base.types';

export interface ICreateMerchant {
    name?: string;
    walletAddress: string;
    shippingAddress?: string;
    externalLink?: string;
}

export interface IMerchantFilterQuery extends IBaseFilterQuery {
    name?: string;
    walletAddress?: string;
    shippingAddress?: string;
    externalLink?: string;
}
