"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("@/controllers/userController");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.put('/profile', userController_1.updateProfile);
router.get('/', auth_1.requireAdmin, userController_1.getUsers);
router.post('/', auth_1.requireAdmin, userController_1.createUser);
router.put('/:id', auth_1.requireAdmin, userController_1.updateUser);
router.delete('/:id', auth_1.requireAdmin, userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map