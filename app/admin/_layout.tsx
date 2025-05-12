import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack initialRouteName="dashboard">
      <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="index" options={{ title: 'Student Management' }} />
      <Stack.Screen name="classes" options={{ title: 'Classes Management' }} />
      <Stack.Screen name="instructors" options={{ title: 'Instructors Management' }} />
      <Stack.Screen name="beltlevels" options={{ title: 'Belt Levels Management' }} />
      <Stack.Screen name="examschedule" options={{ title: 'Exam Schedule Management' }} />
      <Stack.Screen name="examregistration" options={{ title: 'Exam Registration Management' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
    </Stack>
  );
}