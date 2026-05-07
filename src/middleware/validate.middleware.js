import ApiError from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.validated = parsed;
    next();
  } catch (error) {
    if (error?.issues) {
      const errors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new ApiError(400, 'Validation failed', errors);
    }
    next(error);
  }
};

export default validate;
