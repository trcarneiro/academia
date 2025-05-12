import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const AdminDashboard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.placeholder}>Welcome to the admin panel. Navigate using the menu.</Text>
      <View style={styles.menuContainer}>
        <Link href="/admin" style={styles.menuLink}>
          <Text>Students</Text>
        </Link>
        {/* Placeholder links for other sections */}
        <Link href="/admin/classes" style={styles.menuLink}>
 <Text>Classes</Text>
 </Link>
 <Link href="/admin/instructors" style={styles.menuLink}>
 <Text>Instructors</Text>
 </Link>
        <Link href="/admin/beltlevels" style={styles.menuLink}>
          <Text>Belt Levels</Text>
        </Link>
        <Link href="/admin/examschedule" style={styles.menuLink}>
          <Text>Exam Schedule</Text>
        </Link>
        <Link href="/admin/examregistration" style={styles.menuLink}>
          <Text>Exam Registration</Text>
        </Link>
        <Link href="/admin/reports" style={styles.menuLink}>
          <Text>Reports</Text>
        </Link>




      </View>
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
  placeholder: {
    fontSize: 16,
    color: '#666', // Medium gray text
    textAlign: 'center',
  },
  menuContainer: {
    marginTop: 40,
    alignItems: 'flex-start', // Align links to the left
  },
  menuLink: {
    fontSize: 18,
    color: '#007bff', // Blue link color
    marginBottom: 15,
    textDecorationLine: 'underline', // Add underline to make them look like links

  },
});

export default AdminDashboard;