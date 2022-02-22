import { IBaseFilterQuery } from './base.types';
import { AgentStatus } from '../constants/global.constants';
export interface IAgentFilterQuery extends IBaseFilterQuery {
    walletAddress?: string;
    status?: string;
    fromScore?: string;
    toScore?: string;
}

export interface IAgentUpdate {
    walletAddress: string;
    status?: AgentStatus;
    disputeId?: number;
}
