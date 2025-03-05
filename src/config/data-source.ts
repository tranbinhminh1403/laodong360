import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;

console.log(DB_USERNAME, DB_PASSWORD, DB_DATABASE)

export const AppDataSource = new DataSource({
    type: "mysql",
    host: DB_HOST,
    port: parseInt(DB_PORT || "3306"),
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    synchronize: true,
    logging: false,
    entities: [__dirname + "/../entities/*.ts"],
    migrations: [__dirname + "/../migrations/*.ts"],
    subscribers: [],
})