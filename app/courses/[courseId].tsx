import { Stack, useLocalSearchParams } from "expo-router";
import { CourseDetailScreen } from "../src/features/courses/presentation/screens/CourseDetailScreen";

export default function CourseDetailRoute() {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();

  const title = Array.isArray(courseId)
    ? courseId[0] ?? "Curso"
    : courseId ?? "Curso";

  return (
    <>
      <Stack.Screen options={{ title }} />
      <CourseDetailScreen />
    </>
  );
}
