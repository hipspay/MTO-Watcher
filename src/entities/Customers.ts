import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { IsNumber, IsString } from 'class-validator';

import { Orders } from './Orders';

@Entity('customers')
export class Customers extends BaseEntity {
    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column({ nullable: true })
    name: string;

    @IsString()
    @Column()
    walletAddress: string;

    @IsString()
    @Column({ nullable: true })
    shippingAddress: string;

    @IsString()
    @Column({ nullable: true })
    externalLink: string;

    @OneToMany(() => Orders, (order) => order.customer)
    orders: Orders[];
}
