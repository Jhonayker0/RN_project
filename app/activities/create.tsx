import { Stack } from "expo-router";
import CreateActivityScreen from "../src/features/activities/presentation/screens/CreateActivityScreen";

export default function CreateActivityRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Crear Actividad", headerShown: false }} />
      <CreateActivityScreen />
    </>
  );
}
