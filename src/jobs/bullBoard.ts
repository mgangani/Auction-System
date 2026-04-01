import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { auctionQueue } from "./auction/queue";
import { notificationQueue } from "./notification/queue";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/api/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(auctionQueue),
    new BullMQAdapter(notificationQueue),
  ],
  serverAdapter,
});

export { serverAdapter };
