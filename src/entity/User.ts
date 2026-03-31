import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Product } from "./Product";
import { Bid } from "./Bid";
import { UserRole } from "../types/enums";
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar", nullable: true })
  password_hash?: string;

  @Column({ type: "varchar", nullable: true, unique: true })
  google_id?: string;

  @Column({ type: "varchar", default: "LOCAL" })
  provider?: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Product, (product) => product.seller)
  products!: Product[];

  @OneToMany(() => Product, (product) => product.winner)
  wonProducts!: Product[];

  @OneToMany(() => Bid, (bid) => bid.bidder)
  bids!: Bid[];
}
