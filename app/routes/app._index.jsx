import { useLoaderData } from "@remix-run/react";
import { Box, Card, Page } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import orders from "../utils/orders";
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

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const shopifyFunction = await prisma.shopifyFunction.findMany();
  let loaderResponse = {};

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

  loaderResponse.orders = await prisma.orders.findMany();

  return loaderResponse;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  return null;
};

export default function Index() {
  const loaderData = useLoaderData();

  const data = [
    {
      name: "Page A",
      uv: 4000,
      pv: 2400,
      amt: 2400,
    },
    {
      name: "Page B",
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
    {
      name: "Page C",
      uv: 2000,
      pv: 9800,
      amt: 2290,
    },
    {
      name: "Page D",
      uv: 2780,
      pv: 3908,
      amt: 2000,
    },
    {
      name: "Page E",
      uv: 1890,
      pv: 4800,
      amt: 2181,
    },
    {
      name: "Page F",
      uv: 2390,
      pv: 3800,
      amt: 2500,
    },
    {
      name: "Page G",
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },
  ];

  return (
    <Page>
      <ui-title-bar title="Discounts By Tags - Dashboard"></ui-title-bar>
      <Box paddingBlock="500">
        <Card>
          <BarChart width={900} height={250} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pv" fill="#8884d8" />
            <Bar dataKey="uv" fill="#82ca9d" />
          </BarChart>
        </Card>
      </Box>
      <OrdersTable orders={loaderData.orders} />
    </Page>
  );
}
