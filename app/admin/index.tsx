import React from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Button, GestureResponderEvent } from 'react-native';

const AdminIndexScreen = () => {
  // Add state variables and handler functions here as needed (e.g., for modal, student data)
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState(null); // Or appropriate initial state
  const [studentName, setStudentName] = React.useState('');
  const [studentMatricula, setStudentMatricula] = React.useState('');
  function handleSaveStudent(event: GestureResponderEvent): void {
    throw new Error('Function not implemented.');
  }

  // Add more state for other student fields

  return (
    <View style={styles.container}>
      <Text>Student Management Screen</Text>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}> 
          <View style={styles.modalContent}>
            <Text>{editingStudent ? 'Edit Student' : 'Add Student'}</Text>
            <TextInput
              placeholder="Name"
              value={studentName}
              onChangeText={setStudentName}
              style={styles.input} 
            />
            <TextInput
              placeholder="Matricula"
              value={studentMatricula}
              onChangeText={setStudentMatricula}
              style={styles.input} 
            />
            <Button title="Save" onPress={handleSaveStudent} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5, // For Android shadow
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});


export default AdminIndexScreen;