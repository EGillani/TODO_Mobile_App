import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';

const Task = (props) => {

  const formatDate = () => {
    let date = props.item.DueDate;
    let formattedDate = moment(new Date(date)).format('hh:mm A');
    return formattedDate;
  }

  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <View style={styles.circle}></View>
        <Text style={styles.itemText}>{props.item.Task}</Text>
      </View>
      <View><Text>{formatDate()}</Text></View>
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  circle: {
    width: 24,
    height: 24,
    backgroundColor: '#3d53b0',
    opacity: 0.4,
    borderRadius: 100,
    marginRight: 15,
  },
  itemText: {
    maxWidth: '80%',
  },
});

export default Task;