"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statisticsController_1 = require("@/controllers/statisticsController");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', statisticsController_1.getStatistics);
router.get('/export', auth_1.requireAdmin, statisticsController_1.exportStatistics);
exports.default = router;
//# sourceMappingURL=statistics.js.map