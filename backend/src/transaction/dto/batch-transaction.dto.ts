import {
  IsArray,
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  IsIn,
  ArrayMinSize,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

/** 批量操作类型 */
export enum BatchOperation {
  UPDATE_CATEGORY = 'update_category',
  UPDATE_TYPE = 'update_type',
  UPDATE_DATE = 'update_date',
  MOVE_BOOK = 'move_book',
  DELETE = 'delete',
}

/** 批量操作附带的数据载荷 */
export interface BatchPayload {
  category_id?: string;
  type?: 'income' | 'expense';
  date?: string;
  book_id?: string;
}

/**
 * 自定义校验器：根据 operation 动态校验 payload 必填字段
 */
@ValidatorConstraint({ name: 'batchPayloadRequired', async: false })
class BatchPayloadRequiredValidator implements ValidatorConstraintInterface {
  validate(_value: any, args: ValidationArguments): boolean {
    const dto = args.object as BatchTransactionDto;
    const { operation, payload } = dto;

    if (operation === BatchOperation.DELETE) {
      // 删除操作不需要 payload
      return true;
    }

    if (!payload) {
      return false;
    }

    switch (operation) {
      case BatchOperation.UPDATE_CATEGORY:
        return typeof payload.category_id === 'string' && payload.category_id.length > 0;
      case BatchOperation.UPDATE_TYPE:
        return payload.type === 'income' || payload.type === 'expense';
      case BatchOperation.UPDATE_DATE:
        return typeof payload.date === 'string' && payload.date.length > 0;
      case BatchOperation.MOVE_BOOK:
        return typeof payload.book_id === 'string' && payload.book_id.length > 0;
      default:
        return true;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as BatchTransactionDto;
    const { operation } = dto;

    switch (operation) {
      case BatchOperation.UPDATE_CATEGORY:
        return '更新分类时 payload.category_id 为必填项';
      case BatchOperation.UPDATE_TYPE:
        return '更新类型时 payload.type 为必填项（income 或 expense）';
      case BatchOperation.UPDATE_DATE:
        return '更新日期时 payload.date 为必填项';
      case BatchOperation.MOVE_BOOK:
        return '移动账本时 payload.book_id 为必填项';
      default:
        return '该操作所需的 payload 字段缺失';
    }
  }
}

export class BatchTransactionDto {
  @IsArray({ message: 'ids 必须为数组' })
  @IsInt({ each: true, message: 'ids 中的每个元素必须为整数' })
  @ArrayMinSize(1, { message: 'ids 数组至少需要 1 个元素' })
  ids: number[];

  @IsEnum(BatchOperation, { message: 'operation 必须为合法的批量操作类型' })
  operation: BatchOperation;

  @IsOptional()
  @Validate(BatchPayloadRequiredValidator)
  payload?: BatchPayload;
}
