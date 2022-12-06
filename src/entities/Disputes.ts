import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { IsNumber, IsString } from 'class-validator';

import { Orders } from './Orders';
import { Agents } from './Agents';
import { DisputeStatus } from '../shared/constants/global.constants';

@Entity('disputes')
export class Disputes extends BaseEntity {
    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Orders, (order) => order.id)
    order: Orders;

    @IsString()
    @Column({ nullable: true })
    description: string;

    @IsNumber()
    @Column()
    disputeId: number;

    @IsNumber()
    @Column()
    approvedCount: number;

    @IsNumber()
    @Column()
    disapprovedCount: number;

    @IsNumber()
    @Column()
    reviewCount: number;

    @IsNumber()
    @Column()
    criteriaCount: number;

    @IsNumber()
    @Column()
    appliedAgentsCount: number;

    @IsNumber()
    @Column()
    disputeReviewGroupCount: number;

    @Column({
        type: 'enum',
        enum: DisputeStatus,
    })
    status: DisputeStatus;

    @OneToMany(() => Agents, (agent) => agent.dispute)
    agents: Agents[];
}
