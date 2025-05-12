import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExamScheduleManagement = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exam Schedule Management</Text>
      {/* Add your exam schedule management content here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Light gray background
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333', // Dark gray text
  },
});

export default ExamScheduleManagement;