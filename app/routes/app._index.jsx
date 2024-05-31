import { useActionData } from "@remix-run/react";
import {
  Badge,
  Card,
  ChoiceList,
  IndexFilters,
  IndexTable,
  Page,
  useIndexResourceState,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useCallback, useState } from "react";
import orders from "../utils/orders";

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

  // Table Start

  function disambiguateLabel(key, value) {
    switch (key) {
      case "type":
        return value.map((val) => `type: ${val}`).join(", ");
      case "tone":
        return value.map((val) => `tone: ${val}`).join(", ");
      default:
        return value;
    }
  }
  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === "" || value == null;
    }
  }
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const [itemStrings, setItemStrings] = useState([
    "All",
    "Active",
    "Draft",
    "Archived",
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
              onPrimaryAction: async (name) => {
                await sleep(1);
                duplicateView(name);
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
  const [selected, setSelected] = useState(0);
  const onCreateNewView = async (value) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };
  const sortOptions = [
    { label: "Product", value: "product asc", directionLabel: "Ascending" },
    { label: "Product", value: "product desc", directionLabel: "Descending" },
    { label: "Status", value: "tone asc", directionLabel: "A-Z" },
    { label: "Status", value: "tone desc", directionLabel: "Z-A" },
    { label: "Type", value: "type asc", directionLabel: "A-Z" },
    { label: "Type", value: "type desc", directionLabel: "Z-A" },
    { label: "Vendor", value: "vendor asc", directionLabel: "Ascending" },
    { label: "Vendor", value: "vendor desc", directionLabel: "Descending" },
  ];
  const [sortSelected, setSortSelected] = useState(["product asc"]);
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
  const [tone, setStatus] = useState(undefined);
  const [type, setType] = useState(undefined);
  const [queryValue, setQueryValue] = useState("");
  const handleStatusChange = useCallback((value) => setStatus(value), []);
  const handleTypeChange = useCallback((value) => setType(value), []);
  const handleFiltersQueryChange = useCallback(
    (value) => setQueryValue(value),
    []
  );
  const handleStatusRemove = useCallback(() => setStatus(undefined), []);
  const handleTypeRemove = useCallback(() => setType(undefined), []);
  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);
  const handleFiltersClearAll = useCallback(() => {
    handleStatusRemove();
    handleTypeRemove();
    handleQueryValueRemove();
  }, [handleStatusRemove, handleQueryValueRemove, handleTypeRemove]);
  const filters = [
    {
      key: "tone",
      label: "Status",
      filter: (
        <ChoiceList
          title="tone"
          titleHidden
          choices={[
            { label: "Active", value: "active" },
            { label: "Draft", value: "draft" },
            { label: "Archived", value: "archived" },
          ]}
          selected={tone || []}
          onChange={handleStatusChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: "type",
      label: "Type",
      filter: (
        <ChoiceList
          title="Type"
          titleHidden
          choices={[
            { label: "Brew Gear", value: "brew-gear" },
            { label: "Brew Merch", value: "brew-merch" },
          ]}
          selected={type || []}
          onChange={handleTypeChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];
  const appliedFilters = [];
  if (tone && !isEmpty(tone)) {
    const key = "tone";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, tone),
      onRemove: handleStatusRemove,
    });
  }
  if (type && !isEmpty(type)) {
    const key = "type";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, type),
      onRemove: handleTypeRemove,
    });
  }

  const products = [
    {
      id: "1020",
      price: "$200",
      product: "1ZPRESSO | J-MAX Manual Coffee Grinder",
      tone: <Badge tone="success">Active</Badge>,
      inventory: "20 in stock",
      type: "Brew Gear",
      vendor: "Espresso Shot Coffee",
    },
    {
      id: "1018",
      price: "$200",
      product: "Acaia Pearl Set",
      tone: <Badge tone="success">Active</Badge>,
      inventory: "2 in stock for 50 variants",
      type: "Brew Gear",
      vendor: "Espresso Shot Coffee",
    },
    {
      id: "1016",
      price: "$200",
      product: "AeroPress Go Brewer",
      tone: <Badge tone="info">Draft</Badge>,
      inventory: "3 in stock for 50 variants",
      type: "Brew Gear",
      vendor: "Espresso Shot Coffee",
    },
    {
      id: "1015",
      price: "$200",
      product: "Canadiano Brewer",
      tone: <Badge tone="success">Active</Badge>,
      inventory: "890 in stock for 50 variants",
      type: "Brew Merch",
      vendor: "Espresso Shot Coffee",
    },
    {
      id: "1014",
      price: "200",
      product: "Canadiano Brewer White Ash",
      tone: <Badge tone="success">Active</Badge>,
      inventory: "890 in stock for 50 variants",
      type: "Brew Gear",
      vendor: "Espresso Shot Coffee",
    },
  ];
  const resourceName = {
    singular: "order",
    plural: "Orders",
  };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products);
  const rowMarkup = orders.map(
    (
      {
        id,
        store,
        discount_code_id,
        discount_code,
        date,
        order_id,
        order_total,
        discount_total,
      },
      index
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>{store}</IndexTable.Cell>
        <IndexTable.Cell>{discount_code}</IndexTable.Cell>
        <IndexTable.Cell>{order_total}</IndexTable.Cell>
        <IndexTable.Cell>{discount_total}</IndexTable.Cell>
        <IndexTable.Cell>{date}</IndexTable.Cell>
      </IndexTable.Row>
    )
  );
  // const rowMarkup = products.map(
  //   (
  //     { id, thumbnail, product, price, tone, inventory, type, vendor },
  //     index
  //   ) => (
  //     <IndexTable.Row
  //       id={id}
  //       key={id}
  //       selected={selectedResources.includes(id)}
  //       position={index}
  //     >
  //       <IndexTable.Cell>
  //         <img
  //           src={"https://picsum.photos/50?random=" + String(index)}
  //           alt={"product thumbnail" + product}
  //         />
  //       </IndexTable.Cell>
  //       <IndexTable.Cell>{product}</IndexTable.Cell>
  //       <IndexTable.Cell>{price}</IndexTable.Cell>
  //       <IndexTable.Cell>{tone}</IndexTable.Cell>
  //       <IndexTable.Cell>{inventory}</IndexTable.Cell>
  //       <IndexTable.Cell>{type}</IndexTable.Cell>
  //       <IndexTable.Cell>{vendor}</IndexTable.Cell>
  //     </IndexTable.Row>
  //   )
  // );

  // Table End

  return (
    <Page>
      <ui-title-bar title="Discounts By Tags - Dashboard"></ui-title-bar>
      <Card padding="0">
        <IndexFilters
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          queryValue={queryValue}
          queryPlaceholder="Searching in all"
          onQueryChange={handleFiltersQueryChange}
          onQueryClear={() => {}}
          onSort={setSortSelected}
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
          itemCount={products.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          sortable={[false, true, true, true, true, true, true]}
          headings={[
            { title: "Store" },
            { title: "Discount Code" },
            { title: "Order Total" },
            { title: "Discount Toal" },
            { title: "Date" },
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </Card>
    </Page>
  );
}
