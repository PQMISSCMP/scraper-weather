import { Pool } from "pg";

let pool: Pool;
export const getPool = () => {
  if (pool) return pool;
  pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: Number.parseInt(process.env.DB_PORT!)
  });
  return pool;
};
