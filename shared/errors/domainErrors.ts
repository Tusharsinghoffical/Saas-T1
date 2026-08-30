export class DomainError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = "Authentication required.") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = "Forbidden: Insufficient permissions.") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = "Resource not found.") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string = "Validation failed.", details?: any) {
    super(message, 400, details);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends DomainError {
  constructor(
    message: string = "Rate limit exceeded.",
    public retryAfterSeconds?: number
  ) {
    super(message, 429, { retryAfterSeconds });
    this.name = "RateLimitError";
  }
}
