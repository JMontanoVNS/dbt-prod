import {
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  ChoiceList,
  DatePicker,
  Form,
  FormLayout,
  Icon,
  InlineGrid,
  InlineStack,
  OptionList,
  Page,
  Popover,
  Scrollable,
  Select,
  Tag,
  TextField,
  useBreakpoints,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useEffect, useRef, useState } from "react";
import { CalendarIcon, ArrowRightIcon } from "@shopify/polaris-icons";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request, params }) => {
  await authenticate.admin(request);
  if (Object.keys(params).length > 0) {
    const discountId = Number(params.discountId);
    const discount = await prisma.discounts.findUnique({
      where: {
        id: discountId,
      },
    });

    return json({ discount });
  }

  return null;
};

export const action = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);

  const requestData = await request.formData();
  const formData = Object.fromEntries(requestData);

  const discountId = Number(params.discountId);
  const shopifyFunction = await prisma.shopifyFunction.findFirst();

  formData.amount = parseFloat(formData.amount);
  formData.startsAt = new Date(formData.startsAt);
  formData.endsAt = new Date(formData.endsAt);
  formData.productTags =
    formData.productTags.length < 0 ? null : formData.productTags;

  let metafieldData = {
    [formData.discountType]: formData.amount.toString(),
    customerTags: formData.customerTags.split(","),
    productTags: formData.productTags.split(","),
  };

  // start - update discount
  if (Object.keys(params).length > 0) {
    const discount = await prisma.discounts.findUnique({
      where: {
        id: discountId,
      },
    });
    const shopify_discountId = discount.discountId;

    let updatedEntries = {};
    for (key in formData) {
      if (key === "title" || key === "startsAt" || key === "endsAt") {
        if (formData[key] !== discount[key]) {
          updatedEntries[key] = formData[key];
        } else {
          updatedEntries[key] = discount[key];
        }
      }
    }

    const getDiscountMetafield = await admin.graphql(
      `#graphql
      query automaticDiscountNode($id: ID!){
        automaticDiscountNode(id: $id) {
          ... on DiscountAutomaticNode {
            id
            metafield(namespace: "product-discount-by-tags", key :"function-configuration") {
              namespace
              id
              key
              value
            }
          }
        }
      }`,
      {
        variables: {
          id: shopify_discountId,
        },
      }
    );
    const discountMetafield = await getDiscountMetafield.json();

    const getDiscountUpdate = await admin.graphql(
      `#graphql
      mutation discountAutomaticAppUpdate(
        $discount_id: ID!,
        $metafield_id: ID!,
        $metafield_data: String!,
        $title: String!
        $startsAt: DateTime!
        $endsAt: DateTime!
        ) {
        discountAutomaticAppUpdate(
          id: $discount_id
          automaticAppDiscount: {
            title: $title
            startsAt: $startsAt
            endsAt: $endsAt
            metafields: [
              {
                id: $metafield_id
                value: $metafield_data
              }
            ]
          }
          ) {
          automaticAppDiscount {
            discountId
            title
            startsAt
            endsAt
            status
            appDiscountType {
              appKey
              functionId
            }
            combinesWith {
              orderDiscounts
              productDiscounts
              shippingDiscounts
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          discount_id: shopify_discountId,
          metafield_id:
            discountMetafield.data.automaticDiscountNode.metafield.id,
          metafield_data: JSON.stringify(metafieldData),
          title: updatedEntries.title,
          startsAt: updatedEntries.startsAt,
          endsAt: updatedEntries.endsAt,
        },
      }
    );
    const discountUpdated = await getDiscountUpdate.json();

    if (discountUpdated.data.discountAutomaticAppUpdate.userErrors.length < 1) {
      formData.status =
        discountUpdated.data.discountAutomaticAppUpdate.automaticAppDiscount.status;

      await prisma.discounts.update({
        where: {
          id: discountId,
        },
        data: formData,
      });

      return redirect("/app/discounts");
    }
  }
  // end - update discount

  // start - create discount
  const response = await admin.graphql(
    `#graphql
  mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
    discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
      userErrors {
        field
        message
      }
      automaticAppDiscount {
        discountId
        title
        startsAt
        endsAt
        status
        appDiscountType {
          appKey
          functionId
        }
        combinesWith {
          orderDiscounts
          productDiscounts
          shippingDiscounts
        }
      }
    }
  }`,
    {
      variables: {
        automaticAppDiscount: {
          functionId: shopifyFunction.id,
          title: formData.title,
          startsAt: formData.startsAt,
          endsAt: formData.endsAt,
          combinesWith: {
            orderDiscounts: true,
            productDiscounts: true,
            shippingDiscounts: true,
          },
          metafields: [
            {
              namespace: "product-discount-by-tags",
              key: "function-configuration",
              type: "json",
              value: JSON.stringify(metafieldData),
            },
          ],
        },
      },
    }
  );

  const { data } = await response.json();
  if (data.discountAutomaticAppCreate.automaticAppDiscount?.discountId) {
    formData.discountId =
      data.discountAutomaticAppCreate.automaticAppDiscount.discountId;
    formData.status =
      data.discountAutomaticAppCreate.automaticAppDiscount.status;

    await prisma.discounts.create({
      data: formData,
    });
  }

  return redirect("/app/discounts");
  // end - create discount
};

export default function DiscountsForm() {
  const submit = useSubmit();
  const loaderData = useLoaderData();

  const [form, setForm] = useState({
    title: loaderData?.discount.title ?? "",
    amount: loaderData?.discount.amount ?? "",
    discountType: loaderData?.discount.discountType ?? "percentage",
    customerTags: loaderData?.discount.customerTags?.split(",") ?? [],
    productTags: loaderData?.discount.productTags?.split(",") ?? [],
    startsAt: loaderData?.discount.startsAt ?? "",
    endsAt: loaderData?.discount.endsAt ?? "",
  });

  const handleSubmit = () => {
    submit(form, { replace: true, method: "POST" });
  };

  {
    /* ------------------- Discount type start ------------------- */
  }

  const [selectedDiscountType, setSelectedDiscountType] = useState(
    form.discountType
  );

  const handleDiscountType = (value) => {
    setSelectedDiscountType(value);
    setForm((prevForm) => ({ ...prevForm, discountType: value }));
  };

  {
    /* ------------------- Discount type end ------------------- */
  }

  {
    /* ------------------- Date picker start ------------------- */
  }

  const { mdDown, lgUp } = useBreakpoints();
  const shouldShowMultiMonth = lgUp;
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const yesterday = new Date(
    new Date(new Date().setDate(today.getDate() - 1)).setHours(0, 0, 0, 0)
  );
  const ranges = [
    {
      title: "Today",
      alias: "today",
      period: {
        since: today,
        until: today,
      },
    },
    {
      title: "Yesterday",
      alias: "yesterday",
      period: {
        since: yesterday,
        until: yesterday,
      },
    },
    {
      title: "Last 7 days",
      alias: "last7days",
      period: {
        since: new Date(
          new Date(new Date().setDate(today.getDate() - 7)).setHours(0, 0, 0, 0)
        ),
        until: yesterday,
      },
    },
  ];
  const [popoverActive, setPopoverActive] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState(ranges[0]);
  const [inputValues, setInputValues] = useState({});
  const [{ month, year }, setDate] = useState({
    month: activeDateRange.period.since.getMonth(),
    year: activeDateRange.period.since.getFullYear(),
  });
  const datePickerRef = useRef(null);
  const VALID_YYYY_MM_DD_DATE_REGEX = /^\d{4}-\d{1,2}-\d{1,2}/;
  function isDate(date) {
    return !isNaN(new Date(date).getDate());
  }
  function isValidYearMonthDayDateString(date) {
    return VALID_YYYY_MM_DD_DATE_REGEX.test(date) && isDate(date);
  }
  function isValidDate(date) {
    return date.length === 10 && isValidYearMonthDayDateString(date);
  }
  function parseYearMonthDayDateString(input) {
    // Date-only strings (e.g. "1970-01-01") are treated as UTC, not local time
    // when using new Date()
    // We need to split year, month, day to pass into new Date() separately
    // to get a localized Date
    const [year, month, day] = input.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  function formatDateToYearMonthDayDateString(date) {
    const year = String(date.getFullYear());
    let month = String(date.getMonth() + 1);
    let day = String(date.getDate());
    if (month.length < 2) {
      month = String(month).padStart(2, "0");
    }
    if (day.length < 2) {
      day = String(day).padStart(2, "0");
    }
    return [year, month, day].join("-");
  }
  function formatDate(date) {
    return formatDateToYearMonthDayDateString(date);
  }
  function nodeContainsDescendant(rootNode, descendant) {
    if (rootNode === descendant) {
      return true;
    }
    let parent = descendant.parentNode;
    while (parent != null) {
      if (parent === rootNode) {
        return true;
      }
      parent = parent.parentNode;
    }
    return false;
  }
  function isNodeWithinPopover(node) {
    return datePickerRef?.current
      ? nodeContainsDescendant(datePickerRef.current, node)
      : false;
  }
  function handleStartInputValueChange(value) {
    setInputValues((prevState) => {
      return { ...prevState, since: value };
    });
    if (isValidDate(value)) {
      const newSince = parseYearMonthDayDateString(value);
      setActiveDateRange((prevState) => {
        const newPeriod =
          prevState.period && newSince <= prevState.period.until
            ? { since: newSince, until: prevState.period.until }
            : { since: newSince, until: newSince };
        return {
          ...prevState,
          period: newPeriod,
        };
      });
    }
  }
  function handleEndInputValueChange(value) {
    setInputValues((prevState) => ({ ...prevState, until: value }));
    if (isValidDate(value)) {
      const newUntil = parseYearMonthDayDateString(value);
      setActiveDateRange((prevState) => {
        const newPeriod =
          prevState.period && newUntil >= prevState.period.since
            ? { since: prevState.period.since, until: newUntil }
            : { since: newUntil, until: newUntil };
        return {
          ...prevState,
          period: newPeriod,
        };
      });
    }
  }
  function handleInputBlur({ relatedTarget }) {
    const isRelatedTargetWithinPopover =
      relatedTarget != null && isNodeWithinPopover(relatedTarget);
    if (isRelatedTargetWithinPopover) {
      return;
    }
    setPopoverActive(false);
  }
  function handleMonthChange(month, year) {
    setDate({ month, year });
  }
  function handleCalendarChange({ start, end }) {
    const newDateRange = ranges.find((range) => {
      return (
        range.period.since.valueOf() === start.valueOf() &&
        range.period.until.valueOf() === end.valueOf()
      );
    }) || {
      alias: "custom",
      title: "Custom",
      period: {
        since: start,
        until: end,
      },
    };
    setForm((prevForm) => ({
      ...prevForm,
      startsAt: newDateRange.period.since,
      endsAt: newDateRange.period.until,
    }));
    setActiveDateRange(newDateRange);
  }
  function apply() {
    setPopoverActive(false);
  }
  function cancel() {
    setPopoverActive(false);
  }
  useEffect(() => {
    if (activeDateRange) {
      setInputValues({
        since: formatDate(activeDateRange.period.since),
        until: formatDate(activeDateRange.period.until),
      });
      function monthDiff(referenceDate, newDate) {
        return (
          newDate.month -
          referenceDate.month +
          12 * (referenceDate.year - newDate.year)
        );
      }
      const monthDifference = monthDiff(
        { year, month },
        {
          year: activeDateRange.period.until.getFullYear(),
          month: activeDateRange.period.until.getMonth(),
        }
      );
      if (monthDifference > 1 || monthDifference < 0) {
        setDate({
          month: activeDateRange.period.until.getMonth(),
          year: activeDateRange.period.until.getFullYear(),
        });
      }
    }
  }, [activeDateRange]);

  let buttonValue = activeDateRange.title;
  if (activeDateRange.title === "Custom") {
    buttonValue =
      activeDateRange.period.since.toDateString() +
      " - " +
      activeDateRange.period.until.toDateString();
  }
  if (loaderData && activeDateRange.title === "Today") {
    buttonValue =
      new Date(loaderData.discount.startsAt).toDateString() +
      " - " +
      new Date(loaderData.discount.endsAt).toDateString();
  }

  useEffect(() => {
    if (loaderData) {
      setActiveDateRange((prevState) => {
        const newPeriod = {
          since: new Date(loaderData.discount.startsAt),
          until: new Date(loaderData.discount.endsAt),
        };

        return {
          ...prevState,
          period: newPeriod,
        };
      });
    }
  }, []);

  {
    /* ------------------- Date picker end ------------------- */
  }

  {
    /* ------------------- Customer tags start ------------------- */
  }

  const [customerTagInput, setCustomerTagInput] = useState("");
  const handleCustomerTagInput = (value) => {
    setCustomerTagInput(value);
  };

  const customerKeyPress = (event) => {
    const enterKeyPressed = event.keyCode === 13;
    if (enterKeyPressed) {
      event.preventDefault();
      setForm((prevForm) => ({
        ...prevForm,
        customerTags: prevForm.customerTags.concat(customerTagInput),
      }));
      setCustomerTagInput("");
    }
  };

  const removeCustomerTag = (tag) => {
    return () => {
      setForm((prevForm) => ({
        ...prevForm,
        customerTags: prevForm.customerTags.filter(
          (previousTag) => previousTag !== tag
        ),
      }));
    };
  };

  const customerTagMarkup = form.customerTags.map((option) =>
    option.length < 1 ? null : (
      <Tag key={option} onRemove={removeCustomerTag(option)} url="#">
        {option}
      </Tag>
    )
  );

  {
    /* ------------------- Customer tags end ------------------- */
  }

  {
    /* ------------------- Product tags start ------------------- */
  }

  const [productTagInput, setProductTagInput] = useState("");

  const handleProductTagInput = (value) => {
    setProductTagInput(value);
  };

  const productKeyPress = (event) => {
    const enterKeyPressed = event.keyCode === 13;
    if (enterKeyPressed) {
      event.preventDefault();
      setForm((prevForm) => ({
        ...prevForm,
        productTags: prevForm.productTags.concat(productTagInput),
      }));
      setProductTagInput("");
    }
  };

  const removeProductTag = (tag) => {
    return () => {
      setForm((prevForm) => ({
        ...prevForm,
        productTags: prevForm.productTags.filter(
          (previousTag) => previousTag !== tag
        ),
      }));
    };
  };

  const productTagMarkup = form.productTags.map((option) =>
    option.length < 1 ? null : (
      <Tag key={option} onRemove={removeProductTag(option)} url="#">
        {option}
      </Tag>
    )
  );
  {
    /* ------------------- Product tags end ------------------- */
  }

  return (
    <Page
      title={loaderData ? "Edit Discount" : "Create Discount"}
      backAction={{ content: "Back", url: "/app/discounts" }}
    >
      <Card>
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            {/* Name input */}
            <TextField
              label="Title"
              value={form.title}
              onChange={(event) =>
                setForm((prevForm) => ({ ...prevForm, title: event }))
              }
              autoComplete="off"
            />

            {/* Amount input */}
            <TextField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(event) =>
                setForm((prevForm) => ({ ...prevForm, amount: event }))
              }
              autoComplete="off"
            />

            {/* Customer tags input */}
            <div onKeyDown={customerKeyPress}>
              <TextField
                label="Customer Tags"
                value={customerTagInput}
                autoComplete="off"
                onChange={handleCustomerTagInput}
              ></TextField>
            </div>
            <InlineStack gap="500">{customerTagMarkup}</InlineStack>

            {/* Product tags input */}
            <div onKeyDown={productKeyPress}>
              <TextField
                label="Product Tags"
                value={productTagInput}
                autoComplete="off"
                onChange={handleProductTagInput}
              ></TextField>
            </div>
            <InlineStack gap="100">{productTagMarkup}</InlineStack>

            {/* Start date input */}
            <InlineStack gap="400" blockAlign="start">
              <Popover
                active={popoverActive}
                autofocusTarget="none"
                preferredAlignment="left"
                preferredPosition="below"
                fluidContent
                sectioned={false}
                fullHeight
                activator={
                  <Button
                    size="slim"
                    icon={CalendarIcon}
                    onClick={() => setPopoverActive(!popoverActive)}
                  >
                    {buttonValue}
                  </Button>
                }
                onClose={() => setPopoverActive(false)}
              >
                <Popover.Pane fixed>
                  <InlineGrid
                    columns={{
                      xs: "1fr",
                      mdDown: "1fr",
                      md: "max-content max-content",
                    }}
                    gap={0}
                    ref={datePickerRef}
                  >
                    <Box
                      maxWidth={mdDown ? "516px" : "212px"}
                      width={mdDown ? "100%" : "212px"}
                      padding={{ xs: 500, md: 0 }}
                      paddingBlockEnd={{ xs: 100, md: 0 }}
                    >
                      {mdDown ? (
                        <Select
                          label="dateRangeLabel"
                          labelHidden
                          onChange={(value) => {
                            const result = ranges.find(
                              ({ title, alias }) =>
                                title === value || alias === value
                            );
                            setActiveDateRange(result);
                          }}
                          value={
                            activeDateRange?.title ||
                            activeDateRange?.alias ||
                            ""
                          }
                          options={ranges.map(
                            ({ alias, title }) => title || alias
                          )}
                        />
                      ) : (
                        <Scrollable style={{ height: "334px" }}>
                          <OptionList
                            options={ranges.map((range) => ({
                              value: range.alias,
                              label: range.title,
                            }))}
                            selected={activeDateRange.alias}
                            onChange={(value) => {
                              setActiveDateRange(
                                ranges.find((range) => range.alias === value[0])
                              );
                            }}
                          />
                        </Scrollable>
                      )}
                    </Box>
                    <Box
                      padding={{ xs: 500 }}
                      maxWidth={mdDown ? "320px" : "516px"}
                    >
                      <BlockStack gap="400">
                        <InlineStack gap="200">
                          <div style={{ flexGrow: 1 }}>
                            <TextField
                              role="combobox"
                              label={"Since"}
                              labelHidden
                              prefix={<Icon source={CalendarIcon} />}
                              value={inputValues.since}
                              onChange={handleStartInputValueChange}
                              onBlur={handleInputBlur}
                              autoComplete="off"
                            />
                          </div>
                          <Icon source={ArrowRightIcon} />
                          <div style={{ flexGrow: 1 }}>
                            <TextField
                              role="combobox"
                              label={"Until"}
                              labelHidden
                              prefix={<Icon source={CalendarIcon} />}
                              value={inputValues.until}
                              onChange={handleEndInputValueChange}
                              onBlur={handleInputBlur}
                              autoComplete="off"
                            />
                          </div>
                        </InlineStack>
                        <div>
                          <DatePicker
                            month={month}
                            year={year}
                            selected={{
                              start: activeDateRange.period.since,
                              end: activeDateRange.period.until,
                            }}
                            onMonthChange={handleMonthChange}
                            onChange={handleCalendarChange}
                            multiMonth={shouldShowMultiMonth}
                            allowRange
                          />
                        </div>
                      </BlockStack>
                    </Box>
                  </InlineGrid>
                </Popover.Pane>
                <Popover.Pane fixed>
                  <Popover.Section>
                    <InlineStack align="end">
                      <Button onClick={cancel}>Cancel</Button>
                      <Button primary onClick={apply}>
                        Apply
                      </Button>
                    </InlineStack>
                  </Popover.Section>
                </Popover.Pane>
              </Popover>
            </InlineStack>

            {/* Start Discount type input */}
            <ChoiceList
              title="Discount type"
              choices={[
                { label: "Percentage", value: "percentage" },
                { label: "Fixed Amount", value: "fixedAmount" },
              ]}
              selected={selectedDiscountType}
              onChange={handleDiscountType}
            />

            <Button submit variant="primary">
              Submit
            </Button>
          </FormLayout>
        </Form>
      </Card>
    </Page>
  );
}
