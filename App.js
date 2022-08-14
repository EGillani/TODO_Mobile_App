import * as React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OverflowMenuProvider } from 'react-navigation-header-buttons';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer>
    <OverflowMenuProvider>
    <Stack.Navigator         screenOptions={{
          headerTitleAlign: "center",
          headerTintColor: "black",
          headerStyle: {backgroundColor: Platform.OS === "android" ? "white" : "gray",elevation: 0,shadowOpacity: 0},
        }}>
      <Stack.Screen options={{ headerShown: false }} name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
    </OverflowMenuProvider>
  </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
