import * as firebase from "firebase";
import {firebaseConfig} from './firebase.config';


// Initialize Firebase
let app;
if (firebase.apps.length === 0) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

const auth = firebase.auth();
const db = firebase.firestore(app);
const tasksDb = db.collection("Tasks");

const getTasksFromDB = async () => {
  let taskItemsList = [];
  const snapshot = await tasksDb.where('User', '==', `${auth.currentUser?.email}`).get();
  if (snapshot.empty) {
    console.log("No matching documents.");
    return;
  }
  snapshot.forEach((doc) => {
    taskItemsList.push({ id: doc.id, ...doc.data() });
  });
  //sort the list by time 
  taskItemsList.sort((a,b) => new Date(a.DueDate) - new Date(b.DueDate));
  return taskItemsList;
};
const deleteTaskInDB = async (id) => {
  const res = await tasksDb.doc(id).delete();
  if (res !== undefined) {
    console.log("Error could not delete task");
    return;
  }
};
const addTaskToDB = async  (task) => {
  const res = await tasksDb.add(task);
  if (res === undefined) {
    console.log("Error - could not add task", res.error);
    return;
  } else {
    console.log("New Task added!");
    return res.id;
  }
};
export { auth, getTasksFromDB, deleteTaskInDB, addTaskToDB };
