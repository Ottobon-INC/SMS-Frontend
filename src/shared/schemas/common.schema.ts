import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const nonEmptyStringSchema = z.string().min(1);
