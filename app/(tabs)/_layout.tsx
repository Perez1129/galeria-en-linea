import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#000",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: "#000",
          },
          headerShown: false, // Ocultar el header ya que la galería tiene su propio header
        }}
      >
        <Stack.Screen name="index" options={{ title: "Galería de Imágenes" }} />
      </Stack>
    </>
  )
}

