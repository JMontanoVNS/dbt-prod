import {
  Badge,
  Card,
  ChoiceList,
  Frame,
  IndexFilters,
  IndexTable,
  InlineStack,
  Link,
  Modal,
  Page,
  Text,
  useIndexResourceState,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useCallback, useEffect, useState } from "react";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  let { selectedResources } = Object.fromEntries(formData);
  selectedResources = selectedResources.split(",").map(Number);

  const selectedDiscounts = await prisma.discounts.findMany({
    where: {
      id: {
        in: selectedResources,
      },
    },
  });
  const discountsShopifyIds = selectedDiscounts.map(
    (discount) => discount.discountId
  );

  const response = await admin.graphql(
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
  );
  const { data } = await response.json();
  if (data.discountAutomaticBulkDelete.userErrors.length < 1) {
    const deleteDiscounts = await prisma.discounts.deleteMany({
      where: {
        id: {
          in: selectedResources,
        },
      },
    });

    return json({ deleteDiscounts });
  }

  return json({ error: "There was an error during the process" });
};

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const discountsDB = await prisma.discounts.findMany();

  return json({ discountsDB });
};

export default function Discounts() {
  const navigate = useNavigate();
  const { discountsDB } = useLoaderData();

  {
    /* ------------------- Table data start ------------------- */
  }
  const statusTones = {
    ACTIVE: "success",
    INACTIVE: "warning",
    SCHEDULED: "attention",
    EXPIRED: "critical",
  };
  const [discounts, setDiscounts] = useState(discountsDB);
  const resourceName = {
    singular: "discount",
    plural: "discounts",
  };
  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection,
  } = useIndexResourceState(discounts);
  const rowMarkup = discounts.map(
    (
      {
        id,
        title,
        amount,
        startsAt,
        endsAt,
        status,
        discountType,
        customerTags,
        productTags,
        conditional,
      },
      index
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>{`# ${id}`}</IndexTable.Cell>
        <IndexTable.Cell>
          <Link dataPrimaryLink url={`/app/form/${id}`}>
            <Text fontWeight="bold" as="span">
              {title}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text fontWeight="bold" as="span">
            {`$${amount}`}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={statusTones[status]}>
            <Text fontWeight="bold" as="span">
              {status}
            </Text>
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{discountType}</IndexTable.Cell>
        <IndexTable.Cell>{conditional}</IndexTable.Cell>
        <IndexTable.Cell>
          {new Date(startsAt).toLocaleDateString()}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {new Date(endsAt).toLocaleDateString()}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100">
            {customerTags
              ? customerTags
                  ?.split(",")
                  .map((tag, index) => <Badge key={index}>{tag}</Badge>)
              : "No tags available"}
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100">
            {productTags
              ? productTags
                  ?.split(",")
                  .map((tag, index) => <Badge key={index}>{tag}</Badge>)
              : "No tags available"}
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const createDiscountHandler = () => {
    return navigate("/app/form");
  };
  {
    /* ------------------- Table data end ------------------- */
  }

  {
    /* ------------------- Filters start ------------------- */
  }
  const disambiguateLabel = (key, value) => {
    switch (key) {
      case "status":
        return `Status ${value}`;
      default:
        return value;
    }
  };
  const isEmpty = (value) => {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === "" || value == null;
    }
  };

  const [itemStrings, setItemStrings] = useState([
    "All",
    // "Unpaid",
    // "Open",
    // "Closed",
    // "Local delivery",
    // "Local pickup",
  ]);
  const deleteView = (index) => {
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  const duplicateView = async (name) => {
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };

  const tabs = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions:
      index === 0
        ? []
        : [
            {
              type: "rename",
              onAction: () => {},
              onPrimaryAction: async (value) => {
                const newItemsStrings = tabs.map((item, idx) => {
                  if (idx === index) {
                    return value;
                  }
                  return item.content;
                });
                await sleep(1);
                setItemStrings(newItemsStrings);
                return true;
              },
            },
            {
              type: "duplicate",
              onPrimaryAction: async (value) => {
                await sleep(1);
                duplicateView(value);
                return true;
              },
            },
            {
              type: "edit",
            },
            {
              type: "delete",
              onPrimaryAction: async () => {
                await sleep(1);
                deleteView(index);
                return true;
              },
            },
          ],
  }));
  const onCreateNewView = async (value) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const [selected, setSelected] = useState(0);
  const sortOptions = [
    { label: "Date", value: "date asc", directionLabel: "Ascending" },
    { label: "Date", value: "date desc", directionLabel: "Descending" },
    { label: "Status", value: "status asc", directionLabel: "A-Z" },
    { label: "Status", value: "status desc", directionLabel: "Z-A" },
  ];
  const [sortSelected, setSortSelected] = useState(["date asc"]);
  const onHandleSort = (value) => {
    setSortSelected(value);
    switch (value[0]) {
      case "date asc":
        return setDiscounts(
          [...discounts].sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          )
        );
      case "date desc":
        return setDiscounts(
          [...discounts].sort(
            (a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          )
        );
      default:
        return;
    }
  };
  const { mode, setMode } = useSetIndexFiltersMode();
  const onHandleCancel = () => {};
  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };
  const primaryAction =
    selected === 0
      ? {
          type: "save-as",
          onAction: onCreateNewView,
          disabled: false,
          loading: false,
        }
      : {
          type: "save",
          onAction: onHandleSave,
          disabled: false,
          loading: false,
        };
  const [status, setStatus] = useState("");
  const [queryValue, setQueryValue] = useState("");
  const handleStatusChange = (value) => {
    setStatus(value);
    if (value[0] === "active") value = true;
    if (value[0] === "inactive") value = false;
    const filteredDiscounts = [...discountsDB].filter(
      (discount) => discount.status === value
    );
    return setDiscounts(filteredDiscounts);
  };
  const handleFiltersQueryChange = useCallback(
    (value) => setQueryValue(value),
    []
  );
  const handleStatusRemove = () => {
    setStatus("");
    setDiscounts(discountsDB);
  };
  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);
  const handleFiltersClearAll = useCallback(() => {
    handleStatusRemove();
    handleQueryValueRemove();
  }, [handleStatusRemove, handleQueryValueRemove]);
  const filters = [
    {
      key: "status",
      label: "Status",
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            { label: "ACTIVE", value: "active" },
            { label: "INACTIVE", value: "inactive" },
            { label: "SCHEDULED", value: "scheduled" },
            { label: "EXPIRED", value: "expired" },
          ]}
          selected={status || []}
          onChange={handleStatusChange}
        />
      ),
      shortcut: true,
    },
  ];
  const appliedFilters = [];
  if (status && !isEmpty(status)) {
    const key = "status";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, status),
      onRemove: handleStatusRemove,
    });
  }

  {
    /* ------------------- Filters end ------------------- */
  }

  {
    /* ------------------- Delete Discounts start ------------------- */
  }

  const fetcher = useFetcher();
  const [active, setActive] = useState(false);
  const toggleModal = useCallback(() => setActive((active) => !active), []);
  const handleDelete = () => {
    fetcher.submit({ selectedResources }, { replace: true, method: "DELETE" });
    setActive((active) => !active);
  };

  const promotedBulkActions = [
    {
      content: "Delete Discounts",
      onAction: () => toggleModal(),
    },
  ];

  useEffect(() => {
    setDiscounts(discountsDB);
    clearSelection();
  }, [discountsDB]);

  {
    /* ------------------- Delete Discounts end ------------------- */
  }

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
        <IndexFilters
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          queryValue={queryValue}
          queryPlaceholder="Searching in all"
          onQueryChange={handleFiltersQueryChange}
          onQueryClear={() => setQueryValue("")}
          onSort={onHandleSort}
          primaryAction={primaryAction}
          cancelAction={{
            onAction: onHandleCancel,
            disabled: false,
            loading: false,
          }}
          tabs={tabs}
          selected={selected}
          onSelect={setSelected}
          canCreateNewView
          onCreateNewView={onCreateNewView}
          filters={filters}
          appliedFilters={appliedFilters}
          onClearAll={handleFiltersClearAll}
          mode={mode}
          setMode={setMode}
        />
        <IndexTable
          resourceName={resourceName}
          itemCount={discounts.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          sortable={[
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
          ]}
          headings={[
            { title: "ID" },
            { title: "Name" },
            { title: "Amount" },
            { title: "Status" },
            { title: "Type" },
            { title: "Conditional" },
            { title: "Start Date" },
            { title: "End Date" },
            { title: "Customer Tags" },
            { title: "Product Tags" },
          ]}
          promotedBulkActions={promotedBulkActions}
        >
          {rowMarkup}
        </IndexTable>
      </Card>

      <Frame>
        <div style={{ height: "500px" }}>
          <Modal
            // activator={activator}
            open={active}
            onClose={toggleModal}
            title={`Remove ${selectedResources.length} Discounts?`}
            primaryAction={{
              content: "Delete Discounts",
              onAction: handleDelete,
            }}
            secondaryActions={[
              {
                content: "Cancel",
                onAction: toggleModal,
              },
            ]}
          >
            <Modal.Section>This can’t be undone.</Modal.Section>
          </Modal>
        </div>
      </Frame>
    </Page>
  );
}
