export interface ServerToClientEvents {
  listing_approved: (data: { productId: string }) => void;
  auction_won: (data: { productId: string; amount: number }) => void;
  product_sold: (data: { productId: string; amount?: number }) => void;
  new_bid: (data: { productId: string; amount: number; userId: string }) => void;
}

export interface ClientToServerEvents {
  join_auction: (productId: string) => void;
}
