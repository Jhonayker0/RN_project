import { Stack } from 'expo-router';
import { CreateCategoryScreen } from '../src/features/categories/presentation/screens/CreateCategoryScreen';

export default function CreateCategoryRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Crear categoría' }} />
      <CreateCategoryScreen />
    </>
  );
}
