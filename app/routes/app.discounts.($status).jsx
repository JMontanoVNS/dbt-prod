import { Card, Page } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useContext, useEffect } from "react";
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useParams,
} from "@remix-run/react";
import prisma from "../db.server";
import NotificationContext from "../context/NotificationContext";
import DiscountsTable from "../components/DiscountsTable";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  let loaderResponse = {};

  const discountsDB = await prisma.discounts.findMany().catch((err) => {
    loaderResponse["notification"] = {
      error: "Error fetching Discounts from the Database",
    };
    throw new Error(err);
  });

  loaderResponse["discountsDB"] = discountsDB;

  return loaderResponse;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  let actionData = {};
  const formData = await request.formData();
  let { selectedResources } = Object.fromEntries(formData);
  selectedResources = selectedResources.split(",").map(Number);

  const selectedDiscounts = await prisma.discounts
    .findMany({
      where: {
        id: {
          in: selectedResources,
        },
      },
    })
    .catch((err) => {
      actionData["notification"] = {
        error: "Error fetching discounts from Database",
      };
      throw new Error(err);
    });

  const discountsShopifyIds = selectedDiscounts.map(
    (discount) => discount.discountId
  );

  const discountAutomaticBulkDelete = await admin
    .graphql(
      `#graphql
    mutation discountAutomaticBulkDelete($ids: [ID!]!) {
      discountAutomaticBulkDelete(ids: $ids) {
        job {
          id
          done
        }
        userErrors {
          message
        }
      }
    }`,
      {
        variables: {
          ids: discountsShopifyIds,
        },
      }
    )
    .then((res) => res.json())
    .catch((err) => {
      actionData["notification"] = {
        error: "Error deleting Discounts in Shopify",
      };
      throw new Error(err);
    });

  if (
    discountAutomaticBulkDelete.data.discountAutomaticBulkDelete.userErrors
      .length < 1
  ) {
    await prisma.discounts
      .deleteMany({
        where: {
          id: {
            in: selectedResources,
          },
        },
      })
      .catch((err) => {
        actionData["notification"] = {
          error: "Error removing Discounts in the Database",
        };
        throw new Error(err);
      });

    actionData["notification"] = {
      success: "Discounts successfully removed",
    };

    return actionData;
  }

  actionData["notification"] = {
    error: "Error removing Discounts from Shopify",
  };

  return actionData;
};

export default function Discounts() {
  const params = useParams();
  const navigate = useNavigate();
  const notificationContext = useContext(NotificationContext);
  const loaderData = useLoaderData();
  const actionData = useActionData();

  const createDiscountHandler = () => {
    return navigate("/app/form");
  };

  useEffect(() => {
    if (loaderData?.notification) {
      let responseStatus = Object.keys(loaderData?.notification)[0];
      notificationContext[responseStatus](
        loaderData?.notification[responseStatus]
      );
    }
    if (actionData?.notification) {
      let responseStatus = Object.keys(actionData?.notification)[0];
      notificationContext[responseStatus](
        actionData?.notification[responseStatus]
      );
    }
    if (params?.status && !actionData?.notification) {
      let getResponse = JSON.parse(params?.status);
      let responseStatus = Object.keys(getResponse?.notification)[0];
      notificationContext[responseStatus](
        getResponse?.notification[responseStatus]
      );
    }
  }, [actionData]);

  return (
    <Page
      title={"Discounts"}
      primaryAction={{
        content: "Create Discount",
        onAction: createDiscountHandler,
        disabled: false,
        loading: false,
      }}
    >
      <ui-title-bar title="Discounts By Tags - Discounts"></ui-title-bar>
      <Card padding="0">
        <DiscountsTable discounts={loaderData.discountsDB} />
      </Card>
    </Page>
  );
}
