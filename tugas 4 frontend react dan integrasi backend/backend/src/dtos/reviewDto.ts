/** Bentuk review yang dikirim ke client (tanpa kolom internal). */
export interface ReviewResponseDto {
  id: number;
  stallId: number;
  userId: number;
  rating: number;
  comment: string | null;
  likeCount: number;
  createdAt: string | null;
}

/** Review untuk halaman detail warung: ikut membawa nama penulis. */
export interface ReviewListItemDto extends ReviewResponseDto {
  userName: string;
}
