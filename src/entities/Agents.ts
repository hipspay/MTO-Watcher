import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { IsNumber, IsString } from 'class-validator';

import { Disputes } from './Disputes';
import { AgentStatus } from '../shared/constants/global.constants';

@Entity('agents')
export class Agents extends BaseEntity {
    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Disputes, (dispute) => dispute.id)
    dispute: Disputes;

    @IsString()
    @Column()
    walletAddress: string;

    @Column({
        type: 'enum',
        enum: AgentStatus,
    })
    status: AgentStatus;

    @IsNumber()
    @Column()
    score: number;
}
