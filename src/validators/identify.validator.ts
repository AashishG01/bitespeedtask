import { z } from "zod";

export const identifySchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
}).refine(
  (data) => data.email || data.phoneNumber,
  {
    message: "Either email or phoneNumber must be provided",
  }
);