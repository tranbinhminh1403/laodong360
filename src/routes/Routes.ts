import { Router } from 'express';
import { handleCreateOrder, handleGetOrders } from '../controllers/OrderController';
import { handleWebhookCallback } from '../controllers/WebhookController';
import { handleLogin, handleLogout } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/auth/login', handleLogin);
router.post('/send-order', handleCreateOrder);
router.post('/webhook', handleWebhookCallback);

// Protected routes
router.get('/', authenticateToken as any, handleGetOrders);
router.post('/auth/logout', handleLogout);



export default router; 