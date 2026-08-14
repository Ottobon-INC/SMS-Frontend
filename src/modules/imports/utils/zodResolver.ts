import { z } from "zod";

export const zodResolver = <T extends z.ZodTypeAny>(schema: T) => {
  return async (values: unknown) => {
    try {
      const parsed = await schema.parseAsync(values);
      return {
        values: parsed,
        errors: {}
      };
    } catch (error: any) {
      const errors = error.inner ? error.inner.reduce((acc: any, curr: any) => {
        acc[curr.path] = { message: curr.message };
        return acc;
      }, {}) : error.issues ? error.issues.reduce((acc: any, curr: any) => {
        acc[curr.path[0]] = { message: curr.message };
        return acc;
      }, {}) : {};

      return {
        values: {},
        errors
      };
    }
  };
};
