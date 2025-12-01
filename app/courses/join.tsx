import { Stack } from "expo-router";
import { JoinCourseScreen } from "../src/features/courses/presentation/screens/JoinCourseScreen";

export default function JoinCourseRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Unirme a un curso" }} />
      <JoinCourseScreen />
    </>
  );
}
