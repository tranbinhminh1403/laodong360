import { Router } from 'express';
import { handleCreateOrder, handleGetOrders } from '../controllers/OrderController';
import { handleWebhookCallback } from '../controllers/WebhookController';
import { handleLogin, handleLogout } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/authMiddleware';
import { testEmailLogging } from '../controllers/TestEmailController';
import { testCreateInvoice } from '../controllers/InvoiceController';
import { testCpassService } from '../controllers/CpassController';

const router = Router();

// Public routes
router.post('/auth/login', handleLogin);
router.post('/send-order', handleCreateOrder);
router.post('/webhook', handleWebhookCallback);

// Protected routes
router.get('/', authenticateToken as any, handleGetOrders);
router.post('/auth/logout', handleLogout);

// Add this with your other routes
router.post('/test-email-logging', testEmailLogging);
router.post('/test-invoice', testCreateInvoice);
// router.post('/test-cpass', testCpassService);

export default router; 