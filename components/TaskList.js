import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {auth} from "../firebase";
import Task from "./Task";

const TaskList = (props) => {
  return (
    <SafeAreaView style={styles.container}>
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.tasksWrapper}>
        <Text style={styles.sectionTitle}>Today's tasks</Text>
        <View style={styles.items}>
          {props.taskItems?.length > 0 &&
            props.taskItems.map((item, index) => {
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => props.completeTask(index)}
                >
                  <Task item={item} />
                </TouchableOpacity>
              );
            })}
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>

  );
};

export default TaskList;

const styles = StyleSheet.create({
  container: {
    flex: 1, 
  },
  tasksWrapper: {
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  items: {
    marginTop: 30,
  },
});
