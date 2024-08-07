import {
  Card,
  IndexFilters,
  IndexTable,
  Text,
  useIndexResourceState,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import { useCallback, useState } from "react";

export default function (props) {
  const [orders, setOrders] = useState(props.orders)

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
  const [itemStrings, setItemStrings] = useState(['All']);
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
    onAction: () => {
      switch (item) {
        case "All":
          setOrders((prevState) => props.orders);

          break;

        default:
          break;
      }
    },
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions: []
  }));
  const [selected, setSelected] = useState(0);
  const onCreateNewView = async (value) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };
  const sortOptions = [
    {
      label: "ID",
      value: "id asc",
      directionLabel: "Ascending",
    },
    {
      label: "ID",
      value: "id desc",
      directionLabel: "Descending",
    },
    {
      label: "Order Total",
      value: "order total asc",
      directionLabel: "Ascending",
    },
    {
      label: "Order Total",
      value: "order total desc",
      directionLabel: "Descending",
    },
    {
      label: "Discount Total",
      value: "discount total asc",
      directionLabel: "Ascending",
    },
    {
      label: "Discount Total",
      value: "discount total desc",
      directionLabel: "Descending",
    },
    {
      label: "Date",
      value: "date asc",
      directionLabel: "Ascending",
    },
    {
      label: "Date",
      value: "date desc",
      directionLabel: "Descending",
    },
  ];
  const [sortSelected, setSortSelected] = useState(["id asc"]);
  const onHandleSort = (value) => {
    setSortSelected(value);
    switch (value[0]) {
      case "id asc":
        setOrders((prevState) =>
          [...prevState].sort((a, b) => Number(a.id) - Number(b.id)),
        );

        break;

      case "id desc":
        setOrders((prevState) =>
          [...prevState].sort((a, b) => Number(b.id) - Number(a.id)),
        );

        break;
      
      case "order total asc":
        setOrders((prevState) =>
          [...prevState].sort((a, b) => Number(a.order_total) - Number(b.order_total)),
        );

        break;

      case "order total desc":
      setOrders((prevState) =>
        [...prevState].sort((a, b) => Number(b.order_total) - Number(a.order_total)),
      );

        break;

      case "discount total asc":
      setOrders((prevState) =>
        [...prevState].sort((a, b) => Number(a.discount_total) - Number(b.discount_total)),
      );

        break;

      case "discount total desc":
      setOrders((prevState) =>
        [...prevState].sort((a, b) => Number(b.discount_total) - Number(a.discount_total)),
      );

        break;

      case "date asc":
        setOrders((prevState) =>
          [...prevState].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          ),
        );

        break;

      case "date desc":
        setOrders((prevState) =>
          [...prevState].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        );

        break;


      default:
        break;
    }
  };
  const { mode, setMode } = useSetIndexFiltersMode();
  const onHandleCancel = () => {
    setQueryValue("");
    setOrders((prevState) => props.orders);
  };
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
  const handleFiltersQueryChange = (value) => {
    setQueryValue(value);
    let ordersFiltered = [...props.orders].filter((order) => {
      return value === ""
        ? order
        : Object.values(order).map(item => item?.toString().toLowerCase()).toString().includes(value.trim().toLowerCase());
    });
    setOrders((prevState) => ordersFiltered);
  };
  const handleStatusRemove = useCallback(() => setStatus(undefined), []);
  const handleTypeRemove = useCallback(() => setType(undefined), []);
  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);
  const handleFiltersClearAll = useCallback(() => {
    handleStatusRemove();
    handleTypeRemove();
    handleQueryValueRemove();
  }, [handleStatusRemove, handleQueryValueRemove, handleTypeRemove]);
  const filters = [];
  // const filters = [
  //   {
  //     key: "tone",
  //     label: "Status",
  //     filter: (
  //       <ChoiceList
  //         title="tone"
  //         titleHidden
  //         choices={[
  //           { label: "Active", value: "active" },
  //           { label: "Draft", value: "draft" },
  //           { label: "Archived", value: "archived" },
  //         ]}
  //         selected={tone || []}
  //         onChange={handleStatusChange}
  //         allowMultiple
  //       />
  //     ),
  //     shortcut: true,
  //   },
  //   {
  //     key: "type",
  //     label: "Type",
  //     filter: (
  //       <ChoiceList
  //         title="Type"
  //         titleHidden
  //         choices={[
  //           { label: "Brew Gear", value: "brew-gear" },
  //           { label: "Brew Merch", value: "brew-merch" },
  //         ]}
  //         selected={type || []}
  //         onChange={handleTypeChange}
  //         allowMultiple
  //       />
  //     ),
  //     shortcut: true,
  //   },
  // ];
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
  const resourceName = {
    singular: "order",
    plural: "orders",
  };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(orders);
  const rowMarkup = orders?.map(
    ({ id, date, shop, order_total, discount_total, order_id }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>{`# ${id}`}</IndexTable.Cell>
        <IndexTable.Cell>{shop}</IndexTable.Cell>
        <IndexTable.Cell>{order_id}</IndexTable.Cell>
        <IndexTable.Cell fontWeight="bold">
          <Text fontWeight="bold" as="span">
            ${order_total}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text fontWeight="bold" as="span">
            ${discount_total}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{new Date(date).toLocaleDateString()}</IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  return (
    <Card padding="0">
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Searching in all"
        onQueryChange={handleFiltersQueryChange}
        onQueryClear={() => {}}
        onSort={onHandleSort}
        // primaryAction={primaryAction}
        cancelAction={{
          onAction: onHandleCancel,
          disabled: false,
          loading: false,
        }}
        tabs={tabs}
        selected={selected}
        onSelect={setSelected}
        canCreateNewView
        // onCreateNewView={onCreateNewView}
        filters={filters}
        appliedFilters={appliedFilters}
        onClearAll={handleFiltersClearAll}
        mode={mode}
        setMode={setMode}
      />
      <IndexTable
        resourceName={resourceName}
        itemCount={orders.length}
        selectedItemsCount={
          allResourcesSelected ? "All" : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        sortable={[false, false, false, false, false, false, false]}
        headings={[
          { title: "ID" },
          { title: "Shop" },
          { title: "Order ID" },
          { title: "Order Total" },
          { title: "Discount Total" },
          { title: "Date" },
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
}
