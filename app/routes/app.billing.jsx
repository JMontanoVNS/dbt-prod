import { useSubmit } from "@remix-run/react";
import { Button, Card, Page, Text } from "@shopify/polaris";
import { MONTHLY_PLAN, authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
  console.log('******** SUBMIT BUTTON ********');
  const { billing } = await authenticate.admin(request);

  const billingCheck = await billing.require({
    plans: [MONTHLY_PLAN],
    isTest: true,
    onFailure: async () => billing.request({
      plan: MONTHLY_PLAN,
      isTest: true,
    })
  })

  const subscription = billingCheck.appSubscriptions[0];
  console.log('******** USER HAS SUBSCRIPTION ********')
  console.log(subscription)

  return null;
};

export default function Billing() {
  const submit = useSubmit();
  const paymentTest = () => submit({}, { replace: true, method: "POST" });

  return (
    <Page>
      <ui-title-bar title="Discounts By Tags - Billing Test"></ui-title-bar>
      <Card>
        <Text>Test text TT02</Text>
        <Button onClick={paymentTest}>
          AppPurchaseOneTimeCreate
        </Button>
      </Card>
    </Page>
  );
}
