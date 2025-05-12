import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExamRegistrationAdmin = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exam Registration Management</Text>
      {/* Add your content for Exam Registration management here */}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333', // Dark gray text
  },
});

export default ExamRegistrationAdmin;