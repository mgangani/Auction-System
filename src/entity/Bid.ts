import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Product } from "./Product";
import { User } from "./User";

@Entity("bids")
export class Bid {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Product, (product) => product.bids, { nullable: false })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @ManyToOne(() => User, (user) => user.bids, { nullable: false })
  @JoinColumn({ name: "bidder_id" })
  bidder!: User;

  @Column({ type: "decimal" })
  amount!: number;

  @CreateDateColumn()
  created_at!: Date;
}
