import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';

const App = () => {
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');

  const handleSignIn = async () => {
    try {
      const response = await fetch('http://localhost:3000/signin', { // Replace with your backend URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: input }),
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage('Error signing in.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tablet Sign In</Text>
      <TextInput style={styles.input} placeholder="Enter Matricula or Name" value={input} onChangeText={setInput} />
      <Button title="Sign In" onPress={handleSignIn} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '80%',
  },
  message: {
    marginTop: 20,
    fontSize: 16,
  },
});

export default App;