import { Stack } from "expo-router";
import { CreateCourseScreen } from "../src/features/courses/presentation/screens/CreateCourseScreen";

export default function CreateCourseRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Crear curso" }} />
      <CreateCourseScreen />
    </>
  );
}
