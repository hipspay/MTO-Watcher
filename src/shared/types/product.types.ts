import { IBaseFilterQuery } from './base.types';

export interface IProductFilterQuery extends IBaseFilterQuery {
    fromPrice: string;
    toPrice: string;
    shopAddress: string;
    name: string;
}
