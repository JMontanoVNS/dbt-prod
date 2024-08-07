import { useSubmit } from "@remix-run/react";
import {
  Badge,
  ChoiceList,
  IndexFilters,
  IndexTable,
  InlineStack,
  Link,
  Modal,
  Text,
  useIndexResourceState,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

export default function DiscountsTable(props) {
  {
    /* ------------------- Table data start ------------------- */
  }
  const statusTones = {
    ACTIVE: "success",
    INACTIVE: "warning",
    SCHEDULED: "attention",
    EXPIRED: "critical",
  };
  const [discounts, setDiscounts] = useState(props.discounts);
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
            {discountType === "fixedAmount" ? `$${amount}` : `${amount}%`}
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
    "Active",
    "Expired",
    "Scheduled",
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
    onAction: () => {
      switch (item) {
        case "All":
          setDiscounts((prevState) => props.discounts);

          break;

        case "Active":
          setDiscounts((prevState) =>
            props.discounts.filter((item) => item.status === "ACTIVE"),
          );

          break;

        case "Expired":
          setDiscounts((prevState) =>
            props.discounts.filter((item) => item.status === "EXPIRED"),
          );

          break;

        case "Scheduled":
        setDiscounts((prevState) =>
          props.discounts.filter((item) => item.status === "SCHEDULED"),
        );

        break;

        default:
          break;
      }
    },
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions: []
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
      label: "Amount",
      value: "amount asc",
      directionLabel: "Ascending",
    },
    {
      label: "Amount",
      value: "amount desc",
      directionLabel: "Descending",
    },
    { 
      label: "Start Date", 
      value: "start date asc", 
      directionLabel: "Ascending"
    },
    { 
      label: "Start Date", 
      value: "start date desc", 
      directionLabel: "Descending"
    },
    { 
      label: "End Date", 
      value: "end date asc", 
      directionLabel: "Ascending"
    },
    { 
      label: "End Date", 
      value: "end date desc", 
      directionLabel: "Descending"
    },
  ];
  const [sortSelected, setSortSelected] = useState(["id asc"]);
  const onHandleSort = (value) => {
    setSortSelected(value);
    switch (value[0]) {
      case "id asc":
        setDiscounts((prevState) =>
          [...prevState].sort((a, b) => Number(a.id) - Number(b.id)),
        );

        break;

      case "id desc":
        setDiscounts((prevState) =>
          [...prevState].sort((a, b) => Number(b.id) - Number(a.id)),
        );

        break;
      
      case "amount asc":
        setDiscounts((prevState) =>
          [...prevState].sort((a, b) => Number(a.amount) - Number(b.amount)),
        );

        break;

      case "amount desc":
      setDiscounts((prevState) =>
        [...prevState].sort((a, b) => Number(b.amount) - Number(a.amount)),
      );

        break;

      case "start date asc":
        setDiscounts((prevState) =>
          [...prevState].sort(
            (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          ),
        );

        break;

      case "start date desc":
        setDiscounts((prevState) =>
          [...prevState].sort(
            (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
          ),
        );

        break;

      case "end date asc":
      setDiscounts((prevState) =>
        [...prevState].sort(
          (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
        ),
      );

        break;

      case "end date desc":
        setDiscounts((prevState) =>
          [...prevState].sort(
            (a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime(),
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
    setDiscounts((prevState) => props.discounts);
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
  const [status, setStatus] = useState("");
  const [queryValue, setQueryValue] = useState("");
  const handleStatusChange = (value) => {
    setStatus(value);
    if (value[0] === "active") value = true;
    if (value[0] === "inactive") value = false;
    const filteredDiscounts = [...props.discounts].filter(
      (discount) => discount.status === value
    );
    return setDiscounts(filteredDiscounts);
  };
  const handleFiltersQueryChange = (value) => {
    setQueryValue(value);
    let discountsFiltered = [...props.discounts].filter((discount) => {
      return value === ""
        ? discount
        : Object.values(discount).map(item => item?.toString().toLowerCase()).toString().includes(value.trim().toLowerCase());
    });
    setDiscounts((prevState) => discountsFiltered);
  };
  const handleStatusRemove = useCallback(() => setStatus(undefined), [])
  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);
  const handleFiltersClearAll = useCallback(() => {
    handleStatusRemove();
    handleQueryValueRemove();
  }, [handleStatusRemove, handleQueryValueRemove]);
  const filters = [];
  // const filters = [
  //   {
  //     key: "status",
  //     label: "Status",
  //     filter: (
  //       <ChoiceList
  //         title="Status"
  //         titleHidden
  //         choices={[
  //           { label: "ACTIVE", value: "active" },
  //           { label: "INACTIVE", value: "inactive" },
  //           { label: "SCHEDULED", value: "scheduled" },
  //           { label: "EXPIRED", value: "expired" },
  //         ]}
  //         selected={status || []}
  //         onChange={handleStatusChange}
  //       />
  //     ),
  //     shortcut: true,
  //   },
  // ];
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

  const submit = useSubmit();
  const [active, setActive] = useState(false);
  const toggleModal = useCallback(() => setActive((active) => !active), []);
  const handleDelete = () => {
    submit({ selectedResources }, { method: "DELETE" });
    setActive((active) => !active);
  };

  const promotedBulkActions = [
    {
      destructive: true,
      content: "Delete Discounts",
      onAction: () => toggleModal(),
    },
  ];

  useEffect(() => {
    setDiscounts(props.discounts);
    clearSelection();
  }, [props.discounts]);

  {
    /* ------------------- Delete Discounts end ------------------- */
  }

  return (
    <>
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Searching in all"
        onQueryChange={handleFiltersQueryChange}
        onQueryClear={() => setQueryValue("")}
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
        canCreateNewView={false}
        // onCreateNewView={onCreateNewView}
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

      <Modal
        // activator={activator}
        open={active}
        onClose={toggleModal}
        title={`Remove ${selectedResources.length} Discounts?`}
        primaryAction={{
          destructive: true,
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
    </>
  );
}
