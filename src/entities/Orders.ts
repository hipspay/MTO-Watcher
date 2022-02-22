import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { IsNumber, IsDate } from 'class-validator';

import { Customers } from './Customers';
import { Products } from './Products';
import { Disputes } from './Disputes';
import { OrderStatus } from '../shared/constants/global.constants';

@Entity('orders')
export class Orders extends BaseEntity {
    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Products, (product) => product.id)
    product: Products;

    @ManyToOne(() => Customers, (customer) => customer.id)
    customer: Customers;

    @Column({
        type: 'enum',
        enum: OrderStatus,
    })
    status: OrderStatus;

    @IsNumber()
    @Column()
    escrowId: number;

    @IsDate()
    @Column()
    deliveryTime: Date;

    @IsDate()
    @Column()
    escrowTime: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Disputes, (dispute) => dispute.order)
    disputes: Disputes[];
}
