import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Bid } from "./Bid";
import { ProductStatus } from "../types/enums";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: "seller_id" })
  seller!: User;

  @ManyToOne(() => User, (user) => user.wonProducts, { nullable: true })
  @JoinColumn({ name: "winner_id" })
  winner?: User;

  @Column()
  name!: string;

  @Column("text")
  description!: string;

  @Column({ type: "json" })
  images!: string[];

  @Column({ type: "decimal"})
  starting_price!: number;

  @Column({ type: "decimal" })
  current_highest_bid?: number;

  @Column({ type: "timestamp" })
  bidding_start_time!: Date;

  @Column({ type: "timestamp" })
  bidding_end_time!: Date;

  @Column({
    type: "enum",
    enum: ProductStatus,
    default: ProductStatus.PENDING,
  })
  status!: ProductStatus;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Bid, (bid) => bid.product)
  bids!: Bid[];
}
