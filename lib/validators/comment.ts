import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
  mentions: z.array(z.string()).optional().default([]),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
