import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { IsNumber, IsString } from 'class-validator';

import { Products } from './Products';

@Entity('merchants')
export class Merchants extends BaseEntity {
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

    @OneToMany(() => Products, (product) => product.merchant)
    products: Products[];
}
