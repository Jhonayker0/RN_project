import { RefreshControl, SafeAreaView, StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { useCategoriesController } from '../hooks/useCategoriesController';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export function CategoriesListScreen({ route }: { route?: { params?: { courseId?: string } } }) {
  const courseId = route?.params?.courseId as string | undefined;
  const controller = useCategoriesController(courseId);
  const router = useRouter();

  useEffect(() => {
    // placeholder
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Categorías</Text>
          <Pressable onPress={() => router.push('/categories/create' as any)} style={styles.addButton}>
            <Text style={styles.addLabel}>Nueva</Text>
          </Pressable>
        </View>

        {controller.isLoading ? (
          <View style={styles.centered}>
            <Text>Cargando...</Text>
          </View>
        ) : (
          <FlatList
            data={controller.categories}
            keyExtractor={(item) => item['_id'] ?? item['id'] ?? item['name']}
            refreshControl={<RefreshControl refreshing={controller.isLoading} onRefresh={controller.refresh} />}
            ListEmptyComponent={() => (
              <View style={styles.centered}>
                <Text>No hay categorías</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push({ pathname: '/categories/[categoryId]', params: { categoryId: item['_id'] } } as any)} style={styles.card}>
                <Text style={styles.cardTitle}>{item['name'] ?? 'Categoría'}</Text>
                <Text style={styles.cardMeta}>Tipo: {item['type'] ?? '-'}</Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1, paddingHorizontal: 20, paddingVertical: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  addButton: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addLabel: { color: '#fff', fontWeight: '700' },
  centered: { alignItems: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardMeta: { color: '#6b7280', marginTop: 4 },
});
