import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodIssue, ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = result.error.errors.map(
        (e: ZodIssue) => `${e.path.join('.')}: ${e.message}`,
      );
      throw new BadRequestException(errors);
    }

    return result.data;
  }
}
