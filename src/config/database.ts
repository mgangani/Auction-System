import { DataSource } from "typeorm";

import { Product } from "../entity/Product";
import { User } from "../entity/User";
import { Bid } from "../entity/Bid";
export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "admin@123",
  database: "auction",
  //   entities: ["/src/entity/*.ts"],
  entities: [User, Product, Bid],
  synchronize: false,
  logging: true,
  migrations: ["src/migrations/*.ts"],
});
