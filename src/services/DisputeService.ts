import { Service } from 'typedi';
import {
    Between,
    Connection,
    getRepository,
    LessThanOrEqual,
    MoreThanOrEqual,
} from 'typeorm';

import { Orders } from '../entities/Orders';
import { Customers } from '../entities/Customers';
import { Disputes } from '../entities/Disputes';
import { IDisputeFilterQuery } from '../shared/types/dispute.types';
import {
    DisputeStatus,
    OrderStatus,
} from '../shared/constants/global.constants';

@Service()
export default class DisputeService {
    private getFilters(query: IDisputeFilterQuery) {
        const {
            fromApprovedCount,
            toApprovedCount,
            fromDisapprovedCount,
            toDisapprovedCount,
            fromCriteriaCount,
            toCriteriaCount,
            fromReviewCount,
            toReviewCount,
            status,
        } = query;

        return {
            ...(status && { status }),
            ...(fromApprovedCount &&
                toApprovedCount && {
                    approvedCount: Between(
                        +fromApprovedCount,
                        +toApprovedCount
                    ),
                }),
            ...(fromApprovedCount &&
                !toApprovedCount && {
                    approvedCount: MoreThanOrEqual(+fromApprovedCount),
                }),
            ...(!fromApprovedCount &&
                toApprovedCount && {
                    approvedCount: LessThanOrEqual(+toApprovedCount),
                }),
            ...(fromDisapprovedCount &&
                toDisapprovedCount && {
                    disapprovedCount: Between(
                        +fromDisapprovedCount,
                        +toDisapprovedCount
                    ),
                }),
            ...(fromDisapprovedCount &&
                !toDisapprovedCount && {
                    disapprovedCount: MoreThanOrEqual(+fromDisapprovedCount),
                }),
            ...(!fromDisapprovedCount &&
                toDisapprovedCount && {
                    disapprovedCount: LessThanOrEqual(+toDisapprovedCount),
                }),
            ...(fromCriteriaCount &&
                toCriteriaCount && {
                    criteriaCount: Between(
                        +fromCriteriaCount,
                        +toCriteriaCount
                    ),
                }),
            ...(fromCriteriaCount &&
                !toCriteriaCount && {
                    criteriaCount: MoreThanOrEqual(+fromCriteriaCount),
                }),
            ...(!fromCriteriaCount &&
                toCriteriaCount && {
                    criteriaCount: LessThanOrEqual(+toCriteriaCount),
                }),
            ...(fromReviewCount &&
                toReviewCount && {
                    reviewCount: Between(+fromReviewCount, +toReviewCount),
                }),
            ...(fromReviewCount &&
                !toReviewCount && {
                    reviewCount: MoreThanOrEqual(+fromReviewCount),
                }),
            ...(!fromReviewCount &&
                toReviewCount && {
                    reviewCount: LessThanOrEqual(+toCriteriaCount),
                }),
        };
    }

    public async getDisputes(query: IDisputeFilterQuery): Promise<Disputes[]> {
        const { page, limit, sortBy, order } = query;
        const filter = this.getFilters(query);

        return getRepository(Disputes).find({
            where: filter,
            order: {
                [sortBy ? sortBy : 'id']: order ? order : 'ASC',
            },
            skip: (+page - 1) * +limit,
            take: +limit,
        });
    }

    public async getDisputesByAddress(
        walletAddress: string,
        query: IDisputeFilterQuery
    ): Promise<{ totalCount: number; disputes: Disputes[] }> {
        const customerRepository = getRepository(Customers);
        const orderRepository = getRepository(Orders);
        const disputeRepository = getRepository(Disputes);

        const customer = await customerRepository.findOne({
            where: { walletAddress },
        });

        if (!customer) {
            return null;
        }

        const { page, limit, sortBy, order } = query;

        const orders = await orderRepository.find({
            where: { customer: customer.id },
        });

        if (orders.length === 0) {
            return null;
        }

        const searchFilter = this.getFilters(query);

        const filter = orders.map((order) => ({
            order: order.id,
            ...searchFilter,
        }));

        const totalCount = await disputeRepository.count({
            where: filter,
        });

        const disputes = await disputeRepository.find({
            where: filter,
            relations: ['order', 'order.product'],
            order: {
                [sortBy ? sortBy : 'id']: order ? order : 'ASC',
            },
            skip: (+page - 1) * +limit,
            take: +limit,
        });

        return { totalCount, disputes };
    }

    public async getDisputesByMerchant(
        merchantId: number,
        query: IDisputeFilterQuery
    ): Promise<{ totalCount: number; disputes: Disputes[] }> {
        const {
            page,
            limit,
            fromApprovedCount,
            toApprovedCount,
            fromDisapprovedCount,
            toDisapprovedCount,
            fromCriteriaCount,
            toCriteriaCount,
            fromReviewCount,
            toReviewCount,
            status,
            sortBy,
            order,
        } = query;

        const total = await getRepository(Disputes).manager.query(`
      SELECT disputes.* FROM disputes
      LEFT JOIN orders ON orders.id = disputes."orderId"
      LEFT JOIN products ON products.id = orders."productId"
      WHERE
        products."merchantId" = ${merchantId}
        ${
            fromApprovedCount
                ? `AND disputes."approvedCount" >= ${fromApprovedCount}`
                : ''
        }
        ${
            toApprovedCount
                ? `AND disputes."approvedCount" <= ${toApprovedCount}`
                : ''
        }
        ${
            fromDisapprovedCount
                ? `AND disputes."disapprovedCount" >= ${fromDisapprovedCount}`
                : ''
        }
        ${
            toDisapprovedCount
                ? `AND disputes."disapprovedCount" <= ${toDisapprovedCount}`
                : ''
        }
        ${
            fromCriteriaCount
                ? `AND disputes."criteriaCount" >= ${fromCriteriaCount}`
                : ''
        }
        ${
            toCriteriaCount
                ? `AND disputes."criteriaCount" <= ${toCriteriaCount}`
                : ''
        }
        ${
            fromReviewCount
                ? `AND disputes."reviewCount" >= ${fromReviewCount}`
                : ''
        }
        ${toReviewCount ? `AND disputes."reviewCount" <= ${toReviewCount}` : ''}
        ${status ? `AND disputes."status" = ${status}` : ''}
    `);

        const disputes = await getRepository(Disputes).manager.query(`
      SELECT
        disputes.*,
        products.image as productImage,
        products.name as productName,
        products.price as productPrice
      FROM disputes
      LEFT JOIN orders ON orders.id = disputes."orderId"
      LEFT JOIN products ON products.id = orders."productId"
      WHERE
        products."merchantId" = ${merchantId}
        ${
            fromApprovedCount
                ? `AND disputes."approvedCount" >= ${fromApprovedCount}`
                : ''
        }
        ${
            toApprovedCount
                ? `AND disputes."approvedCount" <= ${toApprovedCount}`
                : ''
        }
        ${
            fromDisapprovedCount
                ? `AND disputes."disapprovedCount" >= ${fromDisapprovedCount}`
                : ''
        }
        ${
            toDisapprovedCount
                ? `AND disputes."disapprovedCount" <= ${toDisapprovedCount}`
                : ''
        }
        ${
            fromCriteriaCount
                ? `AND disputes."criteriaCount" >= ${fromCriteriaCount}`
                : ''
        }
        ${
            toCriteriaCount
                ? `AND disputes."criteriaCount" <= ${toCriteriaCount}`
                : ''
        }
        ${
            fromReviewCount
                ? `AND disputes."reviewCount" >= ${fromReviewCount}`
                : ''
        }
        ${toReviewCount ? `AND disputes."reviewCount" <= ${toReviewCount}` : ''}
        ${status ? `AND disputes."status" = ${status}` : ''}
      ORDER BY disputes."${sortBy ? sortBy : 'id'}" ${order ? order : 'ASC'}
      ${limit ? `LIMIT ${limit}` : ''}
      ${page ? `OFFSET ${(+page - 1) * +limit}` : ''}
    `);

        return { totalCount: total.length, disputes };
    }

    public async getDisputeById(id: number): Promise<Disputes> {
        return getRepository(Disputes).findOne(id);
    }

    public async getDisputeByAddressById(
        walletAddress: string,
        id: number
    ): Promise<Disputes> {
        const customerRepository = getRepository(Customers);
        const orderRepository = getRepository(Orders);
        const disputeRepository = getRepository(Disputes);

        const customer = await customerRepository.findOne({
            where: { walletAddress },
        });

        if (!customer) {
            return null;
        }

        const orders = await orderRepository.find({
            where: { customer: customer.id },
        });

        if (orders.length === 0) {
            return null;
        }

        const filter = orders.map((order) => ({ id, order: order.id }));

        return disputeRepository.findOne({
            where: filter,
            relations: ['order', 'order.product', 'order.product.merchant'],
        });
    }

    public async getDisputeByMerchantById(
        merchantId: number,
        id: number
    ): Promise<Disputes> {
        const dispute = await getRepository(Disputes).findOne(id, {
            relations: ['order', 'order.product', 'order.product.merchant'],
        });

        if (merchantId === dispute.order.product.merchant.id) {
            return dispute;
        }

        return null;
    }

    public async handleDispute(
        _from: string,
        approvedCount: number,
        disapprovedCount: number,
        _escrowId: number,
        _disputeId: number
    ): Promise<any> {
        const disputeRepository = getRepository(Disputes);
        const orderRepository = getRepository(Orders);

        console.log('event received');

        const order = await orderRepository.findOne({
            where: {
                escrowId: _escrowId,
            },
        });
        order.status = OrderStatus.IN_DISPUTE;
        await order.save();
        const exist = await disputeRepository.findOne({
            where: {
                disputeId: _disputeId,
            },
        });
        if (exist) return 'already exists';

        const createDispute = await disputeRepository.save({
            order: order,
            disputeId: _disputeId,
            description: '',
            approvedCount: approvedCount,
            disapprovedCount: disapprovedCount,
            reviewCount: 0,
            criteriaCount: parseInt(process.env.CRITERIA_COUNT),
            status: DisputeStatus.INIT,
        });
        console.log('created Dispute');
        return createDispute;
    }

    public async handleSubmission(
        disputeId: string,
        decision: string,
        connection: Connection
    ): Promise<any> {
        const disputeRepository = getRepository(Disputes);

        const exist = await disputeRepository.findOne({
            where: {
                disputeId,
            },
        });
        if (!exist) return 'dispute does not exists';

        if (decision === '3') {
            await connection
                .createQueryBuilder()
                .update(Disputes)
                .set({
                    approvedCount: () => '"approvedCount" + 1',
                    reviewCount: () => '"reviewCount" + 1',
                    status: DisputeStatus.WAITING,
                })
                .where('disputeId = :disputeId', { disputeId })
                .execute();
        } else {
            await connection
                .createQueryBuilder()
                .update(Disputes)
                .set({
                    disapprovedCount: () => '"disapprovedCount" + 1',
                    reviewCount: () => '"reviewCount" + 1',
                    status: DisputeStatus.WAITING,
                })
                .where('disputeId = :disputeId', { disputeId })
                .execute();
        }
        const afterUpdate = await disputeRepository.findOne({
            where: {
                disputeId,
            },
        });

        return afterUpdate;
    }

    public async handleCompletion(
        disputeId: number,
        decision: DisputeStatus
    ): Promise<any> {
        const disputeRepository = getRepository(Disputes);

        const exist = await disputeRepository.findOne({
            where: {
                disputeId,
            },
        });
        if (!exist) return 'dispute does not exists';

        exist.status = decision;
        await exist.save();

        return exist;
    }

    public async handleAssignment(disputeId: number): Promise<any> {
        const disputeRepository = getRepository(Disputes);

        const exist = await disputeRepository.findOne({
            where: {
                disputeId,
            },
        });
        if (!exist) return 'dispute does not exists';

        exist.status = DisputeStatus.REVIEW;
        await exist.save();

        return exist;
    }
}
