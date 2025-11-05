import { Stack } from 'expo-router';
import { CategoriesListScreen } from '../src/features/categories/presentation/screens/CategoriesListScreen';

export default function CategoriesRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Categorías' }} />
      <CategoriesListScreen />
    </>
  );
}
