import { IBaseFilterQuery } from './base.types';

export interface IDisputeFilterQuery extends IBaseFilterQuery {
    status: string;
    fromApprovedCount: string;
    toApprovedCount: string;
    fromDisapprovedCount: string;
    toDisapprovedCount: string;
    fromReviewCount: string;
    toReviewCount: string;
    fromCriteriaCount: string;
    toCriteriaCount: string;
}
