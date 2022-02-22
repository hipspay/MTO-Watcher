import { Service } from 'typedi';
import {
    Between,
    getRepository,
    ILike,
    LessThanOrEqual,
    MoreThanOrEqual,
} from 'typeorm';

import { Agents } from '../entities/Agents';
import { Disputes } from '../entities/Disputes';
import { Contract } from 'web3-eth-contract';

import { IAgentFilterQuery, IAgentUpdate } from '../shared/types/agent.types';

import { AgentStatus } from '../shared/constants/global.constants';
@Service()
export default class AgentService {
    public async getAgents(query: IAgentFilterQuery): Promise<Agents[]> {
        const {
            walletAddress,
            status,
            fromScore,
            toScore,
            page,
            limit,
            sortBy,
            order,
        } = query;

        let filter = {};

        if (walletAddress) {
            filter = { walletAddress: ILike(`%${walletAddress}%`) };
        }

        if (status) {
            filter = { ...filter, status: status };
        }

        if (fromScore && toScore) {
            filter = { ...filter, score: Between(+fromScore, +toScore) };
        } else if (toScore) {
            filter = { ...filter, score: LessThanOrEqual(+toScore) };
        } else if (fromScore) {
            filter = { ...filter, score: MoreThanOrEqual(+fromScore) };
        }

        return await getRepository(Agents).find({
            where: filter,
            order: {
                [sortBy ? sortBy : 'id']: order ? order : 'ASC',
            },
            skip: (+page - 1) * +limit,
            take: +limit,
        });
    }

    public async getInfo(id: number): Promise<Agents> {
        return await getRepository(Agents).findOne({
            select: ['status', 'score'],
            where: { id },
        });
    }

    public async updateAgent(data: IAgentUpdate): Promise<Agents> {
        console.log(data);
        const agentRepository = getRepository(Agents);
        const disputeRepository = getRepository(Disputes);
        const agent = await agentRepository.findOne({
            where: { walletAddress: data.walletAddress },
        });
        console.log(agent);
        if (!agent) {
            return Promise.reject('No Agent found');
        }

        if (data.status) {
            agent.status = data.status;
        }
        if (data.disputeId) {
            const dispute = await disputeRepository.findOne({
                where: { disputeId: data.disputeId },
            });

            agent.dispute = dispute;
        }
        return await agentRepository.save(agent);
    }

    public async processDisputeCompletion(
        disputeId: number,
        contractInstance: Contract
    ): Promise<Agents[]> {
        const agentRepository = getRepository(Agents);
        const agents: Agents[] = await agentRepository.find({
            where: { dispute: { disputeId } },
            relations: ['dispute'],
        });

        for (const agent of agents) {
            const agentOnContract = await contractInstance.methods
                .agents(agent.walletAddress)
                .call();
            console.log(agentOnContract);
            agent.score = agentOnContract.score;
            let status = null;
            if (agentOnContract.status === '5') {
                status = AgentStatus.EARNED;
            } else if (agentOnContract.status === '6') {
                status = AgentStatus.LOST;
            } else if (agentOnContract.status === '7') {
                agent.status = AgentStatus.LOST;
            }
            agent.status = status;
            await agent.save();
        }
        return agents;
    }

    public async processWithdraw(walletAddress: string): Promise<string> {
        const agentRepository = getRepository(Agents);
        const agent: Agents = await agentRepository.findOne({
            where: { walletAddress },
        });
        if (!agent) return 'agent not found';
        agent.status = AgentStatus.INIT;
        await agent.save();
        console.log(agent);
        return 'agent status updated';
    }
}
