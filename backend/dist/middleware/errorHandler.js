"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    if (error.code === 'P2002') {
        return res.status(400).json({
            success: false,
            error: 'Eindeutiger Wert bereits vorhanden'
        });
    }
    if (error.code === 'P2025') {
        return res.status(404).json({
            success: false,
            error: 'Datensatz nicht gefunden'
        });
    }
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Ungültiger Token'
        });
    }
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token abgelaufen'
        });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validierungsfehler',
            details: error.message
        });
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Interner Serverfehler';
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map