"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tableController_1 = require("@/controllers/tableController");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', tableController_1.getTables);
router.put('/:id/reserve', tableController_1.reserveTable);
router.put('/:id/close', tableController_1.closeTable);
router.post('/', auth_1.requireAdmin, tableController_1.createTable);
router.put('/:id', tableController_1.updateTable);
router.delete('/:id', auth_1.requireAdmin, tableController_1.deleteTable);
exports.default = router;
//# sourceMappingURL=tables.js.map