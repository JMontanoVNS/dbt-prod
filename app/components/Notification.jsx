import { Banner, Box, Page } from "@shopify/polaris";
import { useContext } from "react";
import NotificationContext from "../context/NotificationContext";

export default function Notification() {
  const notificationContext = useContext(NotificationContext);

  return (
    <Page>
      {notificationContext.notification !== null ? (
        <Box paddingBlock="500">
          <Banner
            title={notificationContext.notificationText}
            tone={notificationContext.notification}
            onDismiss={() => notificationContext.clear()}
          />
        </Box>
      ) : null}
    </Page>
  );
}
