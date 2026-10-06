import { DataSource } from "typeorm";

export default new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? "preflight",
  password: process.env.DATABASE_PASSWORD ?? "preflight",
  database: process.env.DATABASE_NAME ?? "preflight",
  synchronize: false,
  migrations: ["src/database/migrations/*.{ts,js}"],
});
