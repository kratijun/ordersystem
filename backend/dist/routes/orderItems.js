"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderItemController_1 = require("@/controllers/orderItemController");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', orderItemController_1.getOrderItems);
router.get('/kitchen', orderItemController_1.getKitchenItems);
router.put('/:id', orderItemController_1.updateOrderItem);
router.put('/:id/start-preparation', orderItemController_1.startPreparation);
router.put('/:id/mark-ready', orderItemController_1.markReady);
router.delete('/:id', auth_1.requireAdmin, orderItemController_1.deleteOrderItem);
exports.default = router;
//# sourceMappingURL=orderItems.js.map