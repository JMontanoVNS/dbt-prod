import React, { useState } from "react";

const NotificationContext = React.createContext({
  notification: null,
  notificationText: null,
  success: () => {},
  error: () => {},
});

const STATES = {
  SUCCESS: "success",
  ERROR: "critical",
};

const NotificationProvider = (props) => {
  const [notification, setNotification] = useState(null);
  const [notificationText, setNotificationText] = useState(null);

  const success = (text) => {
    setNotificationText((prevState) => text);
    setNotification((prevState) => STATES.SUCCESS);

    setTimeout(function () {
      clear();
    }, 10000);
  };

  const error = (text) => {
    setNotificationText((prevState) => text);
    setNotification((prevState) => STATES.ERROR);

    setTimeout(function () {
      clear();
    }, 10000);
  };

  const clear = () => {
    setNotificationText((prevState) => null);
    setNotification((prevState) => null);
  };
  return (
    <NotificationContext.Provider
      value={{
        success,
        error,
        clear,
        notification,
        notificationText,
      }}
    >
      {props.children}
    </NotificationContext.Provider>
  );
};

export { NotificationProvider };
export default NotificationContext;
