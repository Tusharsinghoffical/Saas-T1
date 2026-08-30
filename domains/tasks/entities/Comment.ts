/**
 * Pure Domain Entity: Comment
 * ZERO framework or database imports.
 */

export interface CommentAuthor {
  id: string;
  fullName: string | null;
  avatarUrl?: string | null;
}

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
}

export interface CreateCommentDTO {
  content: string;
  mentions?: string[];
}
