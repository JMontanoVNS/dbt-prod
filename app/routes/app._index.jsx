import { useActionData } from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import orders from "../utils/orders";
import OrdersTable from "../components/OrdersTable";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const shopifyFunction = await prisma.shopifyFunction.findMany();

  if (Object.keys(shopifyFunction).length < 1) {
    let response = await admin.graphql(
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
    );
    const { data } = await response.json();

    await prisma.shopifyFunction.create({
      data: {
        id: data.shopifyFunctions.nodes[0].id,
        title: data.shopifyFunctions.nodes[0].title,
        api_type: data.shopifyFunctions.nodes[0].apiType,
      },
    });
  }

  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  return null;
};

export default function Index() {
  const actionData = useActionData();

  return (
    <Page>
      <ui-title-bar title="Discounts By Tags - Dashboard"></ui-title-bar>
      <OrdersTable orders={orders} />
    </Page>
  );
}
