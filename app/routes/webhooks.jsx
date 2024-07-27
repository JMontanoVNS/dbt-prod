import { authenticate } from "../shopify.server";
import db from "../db.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(
    request
  );

  // if (!admin) {
  //   // The admin context isn't returned if the webhook fired after a shop was uninstalled.
  //   throw new Response();
  // }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }

      break;

    case "ORDERS_CREATE":
      const {
        admin_graphql_api_id,
        total_line_items_price,
        total_discounts,
        created_at,
        discount_applications,
      } = payload;
      const discountsDB = await prisma.discounts.findMany().catch((err) => {
        actionData["notification"] = {
          error: "Webhook error fetching discounts from Database",
        };
        throw new Error(err);
      });
      let orderData = {};
      orderData.line_items = [];

      payload.line_items.forEach((item) => {
        let discountData = {};
        discountData.applied_discounts = [];

        item.discount_allocations.forEach((discount) => {
          let discountDB = discountsDB.filter(
            (item) =>
              item.title ===
              discount_applications[discount.discount_application_index].title
          );

          discountData.applied_discounts.push({
            discount_id: discountDB[0].discountId,
            discount_title:
              discount_applications[discount.discount_application_index].title,
            discount_amount: discount.amount,
          });
        });

        discountData.item_id = item.admin_graphql_api_id;
        discountData.name = item.name;
        discountData.item_price = item.price;
        discountData.item_quantiy = item.quantity;

        orderData.line_items.push(discountData);
      });

      orderData.shop = shop;
      orderData.order_id = admin_graphql_api_id;
      orderData.order_total = total_line_items_price;
      orderData.discount_total = total_discounts;
      orderData.date = created_at;

      await prisma.orders.create({
        data: orderData,
      });

      break;
    case "ORDERS_UPDATED":
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
