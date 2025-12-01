import { Stack, useLocalSearchParams } from "expo-router";
import CategoryDetailScreen from "../../src/features/categories/presentation/screens/CategoryDetailScreen";

export default function CategoryDetailRoute() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  return (
    <>
      <Stack.Screen options={{ title: "Detalle de Categoría", headerShown: false }} />
      <CategoryDetailScreen />
    </>
  );
}
