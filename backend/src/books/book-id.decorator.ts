import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the current book ID from the x-book-id header.
 * Use alongside @CurrentUser() in controllers to scope queries to a book.
 */
export const BookId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-book-id'] || undefined;
  },
);
