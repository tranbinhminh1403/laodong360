import express from "express";
import { AppDataSource } from "./config/data-source";
import cors from "cors";
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import orderRoutes from "./routes/Routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để lấy raw body trước khi parse JSON
// app.use('/api/v1/orders/test-verify', bodyParser.raw({ type: 'application/json' }));
// app.use(bodyParser.raw({ type: 'application/json' }));

// Các route khác vẫn dùng JSON parser
app.use(express.json());
app.use(cors());

// Thêm routes
app.use('/api/v1/orders', orderRoutes);

AppDataSource.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Error initializing TypeORM:", error);
    });

