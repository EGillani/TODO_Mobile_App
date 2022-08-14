import React, { useState, useEffect, useRef } from "react";
import TaskList from "../components/TaskList";
import moment from "moment";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
  LogBox,
  Platform,
} from "react-native";
import { auth, getTasksFromDB, deleteTaskInDB, addTaskToDB } from "../firebase";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  HeaderButtons,
  HeaderButton,
  HiddenItem,
  OverflowMenu,
} from "react-navigation-header-buttons";
import { SimpleLineIcons, Ionicons, Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/core";
import * as SMS from "expo-sms";
import * as MailComposer from "expo-mail-composer";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

LogBox.ignoreLogs([
  "Setting a timer",
  "AsyncStorage has been extracted from react-native core and will be removed in a future release.",
]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const HomeScreen = () => {
  const navigation = useNavigation();
  const [task, setTask] = useState();
  const [taskItems, setTaskItems] = useState([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  //for notifications
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };
  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };
  const handleSignOut = () => {
    //replace is going to remove that back button in navigation
    auth
      .signOut()
      .then(() => {
        navigation.replace("Login");
      })
      .catch((error) => alert(error.message));
  };

  const IoniconsHeaderButton = (props) => (
    // the `props` here come from <Item ... />
    // you may access them and pass something else to `HeaderButton` if you like
    <HeaderButton IconComponent={Ionicons} iconSize={23} {...props} />
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: `${auth.currentUser?.email}'s tasks`,
      headerLeft: () => (
        <HeaderButtons>
          <SimpleLineIcons
            name="logout"
            size={30}
            color="black"
            onPress={handleSignOut}
          />
        </HeaderButtons>
      ),
      headerRight: () => (
        <HeaderButtons HeaderButtonComponent={IoniconsHeaderButton}>
          <OverflowMenu
            style={{ marginHorizontal: 10 }}
            OverflowIcon={({ color }) => (
              <Entypo name="dots-three-horizontal" size={24} color="black" />
            )}
          >
            <HiddenItem
              title="Send List as SMS"
              onPress={() => sendMessageWithSMS()}
            />
            <HiddenItem
              title="Send List as Email"
              onPress={() => sendMessageWithEmail()}
            />
          </OverflowMenu>
        </HeaderButtons>
      ),
    });
  }, [navigation]);

  useEffect(async () => {
    setTaskItems(await getTasksFromDB());
  }, []);

  const alertFunction = (status) => {
    Alert.alert(status, "", [
      { text: "Close", onPress: () => console.log("Close") },
    ]);
  };

  const completeTask = async (index) => {
    //console.log(taskItems[index]);
    await deleteTaskInDB(taskItems[index].id);
    setTaskItems(await getTasksFromDB());
  };

  const validateTime = (date) => {
    let currentTime = new Date().toLocaleTimeString("en-us", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    let setTime = new Date(date).toLocaleTimeString("en-us", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    // console.log(currentTime, setTime);
    if (setTime <= currentTime) {
      alertFunction("Please set a time in the future");
      return false;
    }
    return true;
  };
  const handleAddTask = async (date) => {
      //console.log("A date has been picked: ", date);
      hideDatePicker();
      Keyboard.dismiss();
      let taskObj = {
        DueDate: `${date}`,
        Task: `${task}`,
        User: `${auth.currentUser?.email}`,
      };
      if (validateTime(date)) 
      {
        if (addTaskToDB(taskObj) !== undefined) {
          setTask(null);
          setTaskItems(await getTasksFromDB());
          await schedulePushNotification(taskObj);
        }
      }

    
  };

  useEffect(() => {
    setUpNotifications();
  }, []);

  const setUpNotifications = async () => {
    if (expoPushToken === "") {
      let token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log(response);
        });
    }
  };

  const schedulePushNotification = async (taskObj) => {
    let setTime = new Date(taskObj.DueDate).toLocaleTimeString("en-us", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    let timeParts = setTime.split(":");
    let setHour = parseInt(timeParts[0]);
    let setMinute = parseInt(timeParts[1]);
    let trigger;
    if (Platform.OS !== "android") {
      trigger = { hour: setHour, minute: setMinute, second: 0 };
    } else { //you can't schedule notifications in android - they must be created in seconds later...
      trigger = { seconds : 2};
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "ToDo List Reminder! 📬",
        body: `${taskObj.Task}`,
      },
      trigger: trigger,
    });
  };

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
    } else {
      alert("Must use physical device for Push Notifications");
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
    return token;
  };

  const formatDate = (date) => {
    return moment(new Date(date)).format("hh:mm A");
  };

  const sendMessageWithSMS = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    const messageBody = taskItems
      .map(
        (task, i) =>
          "Do " + task.Task + " by " + formatDate(task.DueDate) + "\n\n"
      )
      .join("");
    //console.log(messageBody);
    if (isAvailable) {
      const { result } = await SMS.sendSMSAsync("2265555555", messageBody);
      console.log(result);
    } else {
      console.log("SMS is not available on this device");
    }
  };
  const sendMessageWithEmail = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    const messageBody = taskItems
      .map(
        (task, i) =>
          "Do " + task.Task + " by " + formatDate(task.DueDate) + "\n\n"
      )
      .join("");

    if (isAvailable) {
      var options = {
        recipients: [`${auth.currentUser?.email}`],
        subject: "ToDo List for Today!",
        body: messageBody,
      };
      MailComposer.composeAsync(options).then((result) => {
        console.log(result.status);
      });
    } else {
      console.log("Email is not available on this device");
    }
  };
  return (
    <View style={styles.container}>
      <TaskList taskItems={taskItems} completeTask={completeTask} />
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="time"
        onConfirm={handleAddTask}
        onCancel={hideDatePicker}
        display="default"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
        style={styles.writeTaskWrapper}
      >
        <TextInput
          style={styles.input}
          placeholder={"Write a task"}
          value={task}
          onChangeText={(text) => setTask(text)}
        />
        <TouchableOpacity onPress={() => showDatePicker()}>
          <View style={styles.addWrapper}>
            <Ionicons name="add" size={34} color="gray" />
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8EAED",
  },
  button: {
    backgroundColor: "#0782F9",
    width: "60%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 40,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  writeTaskWrapper: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginLeft: 15,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderColor: "#C0C0C0",
    borderWidth: 1,
    width: 280,
  },
  addWrapper: {
    marginLeft: 15,
    width: 60,
    height: 60,
    backgroundColor: "#FFF",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#C0C0C0",
    borderWidth: 1,
  },
});
