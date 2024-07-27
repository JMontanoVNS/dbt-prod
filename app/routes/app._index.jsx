import { useLoaderData } from "@remix-run/react";
import { Box, Card, Page } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import OrdersTable from "../components/OrdersTable";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useContext, useEffect } from "react";
import NotificationContext from "../context/NotificationContext";
import DiscountsTable from "../components/DiscountsTable";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  let loaderResponse = {};
  const shopifyFunction = await prisma.shopifyFunction
    .findMany()
    .catch((err) => {
      loaderResponse["notification"] = {
        error: "Error fetching Shopify Function in the Database",
      };
      throw new Error(err);
    });

  if (Object.keys(shopifyFunction).length < 1) {
    let ApiShopifyFunction = await admin
      .graphql(
        `#graphql
      query {
        shopifyFunctions(first: 1) {
          nodes {
            apiType
            title
            id
          }
        }
      }
      `
      )
      .then((res) => res.json())
      .catch((err) => {
        loaderResponse["notification"] = {
          error: "Error fetching Function from Shopify",
        };
        throw new Error(err);
      });

    await prisma.shopifyFunction
      .create({
        data: {
          id: ApiShopifyFunction.data.shopifyFunctions.nodes[0].id,
          title: ApiShopifyFunction.data.shopifyFunctions.nodes[0].title,
          api_type: ApiShopifyFunction.data.shopifyFunctions.nodes[0].apiType,
        },
      })
      .catch((err) => {
        loaderResponse["notification"] = {
          error: "Error storing the Shopify Function in the Database",
        };
        throw new Error(err);
      });
  }

  let orders = await prisma.orders.findMany().catch((err) => {
    loaderResponse["notification"] = {
      error: "Error fetching orders from Database",
    };
    throw new Error(err);
  });

  orders.forEach((order) => {
    return order.line_items.forEach(async (item) => {
      return item.applied_discounts.forEach(async (discount) => {
        return await prisma.discounts
          .findFirst({
            where: {
              discountId: discount.discount_id,
            },
          })
          .then((res) => {
            return (discount["status"] = res.status);
          });
      });
    });
  });

  loaderResponse["orders"] = orders;

  return loaderResponse;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  return null;
};

export default function Index() {
  const loaderData = useLoaderData();
  const notificationContext = useContext(NotificationContext);

  let discountsFromOrders = [];
  loaderData?.orders?.forEach((order) => {
    order.line_items.forEach((item) => {
      item.applied_discounts.forEach((discount) => {
        discount.discount_amount = Number(discount.discount_amount);
        discountsFromOrders.push(discount);
      });
    });
  });

  let discountsStadistics = {};
  discountsFromOrders.forEach((discount) => {
    if (!discountsStadistics[discount.discount_title]) {
      discountsStadistics[discount.discount_title] = {
        ...discount,
        orders_count: 1,
      };
    } else {
      discountsStadistics[discount.discount_title].discount_amount +=
        discount.discount_amount;
      discountsStadistics[discount.discount_title].orders_count++;
    }
  });
  discountsStadistics = Object.values(discountsStadistics);

  console.log(loaderData.orders);

  useEffect(() => {
    if (loaderData.notification?.success) {
      notificationContext.success(loaderData.notification.success);
    }
    if (loaderData.notification?.error) {
      notificationContext.error(loaderData.notification.error);
    }
  }, []);

  return (
    <Page>
      <ui-title-bar title="Discounts By Tags - Dashboard"></ui-title-bar>
      <Box paddingBlock="500">
        <Card>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={discountsStadistics}>
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="discount_title" />
              <YAxis dataKey="discount_amount" />
              <Tooltip />
              <Legend verticalAlign="top" height={30} />
              <Bar
                name="Discount Amount"
                dataKey="discount_amount"
                fill="#82ca9d"
              />
              <Bar name="Orders Count" dataKey="orders_count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Box>
      <OrdersTable orders={loaderData.orders} />
    </Page>
  );
}
