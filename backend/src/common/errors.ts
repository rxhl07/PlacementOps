export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code?: string;

    constructor(message: string, statusCode: number = 400, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this);
    }

    static badRequest(message: string, code = 'BAD_REQUEST') {
        return new AppError(message, 400, code);
    }

    static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
        return new AppError(message, 401, code);
    }

    static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
        return new AppError(message, 403, code);
    }

    static notFound(resource: string) {
        return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
    }

    static conflict(message: string, code = 'CONFLICT') {
        return new AppError(message, 409, code);
    }

    static unprocessable(message: string, code = 'UNPROCESSABLE_ENTITY') {
        return new AppError(message, 422, code);
    }
}