import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Orders {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    email: string;

    // @Column()
    // age: number;

    @Column()
    fullName: string;

    // @Column()
    // gender: string;

    @Column({ nullable: true })
    location: string;

    @Column()
    phoneNumber: string;

    @Column()
    note: string;

    @Column()
    title: string;

    @Column()
    period: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ nullable: true })
    order_id: number;

    @Column({ nullable: true })
    mrc_order_id: string;

    @Column()
    time: string;

    @Column({ default: "Pending" })
    status: string;

    @CreateDateColumn()
    createdAt: Date;
} 