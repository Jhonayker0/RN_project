import { Stack, useLocalSearchParams } from 'expo-router';
import { EditCategoryScreen } from '../src/features/categories/presentation/screens/EditCategoryScreen';

export default function EditCategoryRoute() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  return (
    <>
      <Stack.Screen options={{ title: categoryId ?? 'Categoría' }} />
      <EditCategoryScreen />
    </>
  );
}
