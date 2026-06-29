import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { sendError } from '../utils/response';

/**
 * Middleware factory that runs express-validator chains and formats errors.
 * Usage:
 *   router.post('/route', validate([body('email').isEmail()]), handler)
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validators in parallel
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((err) => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg as string,
        value: err.type === 'field' ? err.value : undefined,
      }));

      sendError(res, 'Validation failed', 400, formattedErrors);
      return;
    }

    next();
  };
};

export default validate;
