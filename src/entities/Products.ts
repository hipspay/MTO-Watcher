import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { IsNumber, IsString } from 'class-validator';

import { Orders } from './Orders';
import { Merchants } from './Merchant';

@Entity('products')
export class Products extends BaseEntity {
    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column({ nullable: true })
    name: string;

    @ManyToOne(() => Merchants, (merchant) => merchant.id)
    merchant: Merchants;

    @IsString()
    @Column()
    description: string;

    @IsString()
    @Column()
    image: string;

    @IsNumber()
    @Column({ type: 'double precision' })
    price: number;

    @IsString()
    @Column()
    shopAddress: string;

    @IsNumber()
    @Column()
    soldOutItems: number;

    @OneToMany(() => Orders, (order) => order.product)
    orders: Orders[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
