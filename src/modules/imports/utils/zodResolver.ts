import { z } from "zod";

type ResolverErrors = Record<string, { message: string }>;

export const zodResolver = <T extends z.ZodTypeAny>(schema: T) => {
  return async (values: unknown) => {
    try {
      const parsed = await schema.parseAsync(values);
      return {
        values: parsed,
        errors: {}
      };
    } catch (error: unknown) {
      const errors: ResolverErrors = {};
      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          const field = issue.path[0]?.toString();
          if (field != null) {
            errors[field] = { message: issue.message };
          }
        }
      }

      return {
        values: {},
        errors
      };
    }
  };
};
