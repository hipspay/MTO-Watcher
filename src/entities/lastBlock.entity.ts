import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    CreateDateColumn,
} from 'typeorm';

@Entity()
export class LastBlock {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    event_name: string;

    @Column({ default: 0 })
    chain_id: number;

    @Column()
    last_fetch_block: number;

    @Column({ default: false })
    is_deleted: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
