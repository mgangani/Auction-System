import { getIO } from "../../sockets";
import type { NotificationJobData } from "../../jobs/notification/types";

export class NotificationService {
  dispatch(data: NotificationJobData): void {
    const io = getIO();

    if (data.type === "listing_approved") {
      io.to(`user:${data.sellerId}`).emit("listing_approved", {
        productId: data.productId,
      });
      return;
    }

    if (data.type === "auction_ended") {
      if (data.winnerId) {
        io.to(`user:${data.winnerId}`).emit("auction_won", {
          productId: data.productId,
          amount: data.finalAmount!,
        });
      }

      io.to(`user:${data.sellerId}`).emit("product_sold", {
        productId: data.productId,
        amount: data.finalAmount,
      });
    }
  }
}
