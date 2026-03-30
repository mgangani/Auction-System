export interface AuctionEndJobData {
  productId: string;
}

export interface NotificationJobData {
  type: "listing_approved" | "auction_ended";
  productId: string;
  sellerId: string;
  winnerId?: string;
  finalAmount?: number;
}
