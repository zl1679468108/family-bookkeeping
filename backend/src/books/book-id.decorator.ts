import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Extracts the current book ID from the user's current_book_id field.
 * Use alongside @CurrentUser() in controllers to scope queries to a book.
 */
export const BookId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    // 从当前用户信息中获取 current_book_id
    const bookId = request.user?.current_book_id;
    
    if (!bookId) {
      throw new UnauthorizedException('请先选择账本');
    }
    
    return bookId;
  },
);
