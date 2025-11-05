import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCategoriesController } from '../hooks/useCategoriesController';

type GroupingType = 'aleatorio' | 'eleccion';

export function EditCategoryScreen() {
  const { categoryId, courseId } = useLocalSearchParams<{ categoryId?: string; courseId?: string }>();
  const router = useRouter();
  const controller = useCategoriesController(courseId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('5');
  const [groupingType, setGroupingType] = useState<GroupingType>('aleatorio');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!categoryId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const cat = await controller.getById(categoryId);
      if (cat) {
        setName(cat['name'] ?? '');
        setDescription(cat['description'] ?? '');
        setCapacity(String(cat['capacity'] ?? 5));
        setGroupingType((cat['type'] as GroupingType) ?? 'random');
      }
      setLoading(false);
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const handleSave = async () => {
    if (!categoryId || !name.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es requerido');
      return;
    }

    const capacityNum = parseInt(capacity, 10);
    if (isNaN(capacityNum) || capacityNum < 1) {
      Alert.alert('Error', 'La capacidad debe ser un número mayor a 0');
      return;
    }

    const success = await controller.updateCategory(categoryId, { 
      name: name.trim(),
      description: description.trim() || undefined,
      capacity: capacityNum,
      type: groupingType,
    });
    
    if (success) {
      Alert.alert('Éxito', 'Categoría actualizada correctamente');
      router.back();
    } else {
      Alert.alert('Error', 'No se pudo actualizar la categoría');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Eliminar Categoría',
      '¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!categoryId) {
              Alert.alert('Error', 'No se encontró el ID de la categoría');
              return;
            }
            
            try {
              console.log('[EditCategoryScreen] Iniciando eliminación de categoría:', categoryId);
              const success = await controller.removeCategory(categoryId);
              console.log('[EditCategoryScreen] Resultado de eliminación:', success);
              
              if (success) {
                Alert.alert('Éxito', 'Categoría eliminada correctamente', [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]);
              } else {
                Alert.alert('Error', 'No se pudo eliminar la categoría');
              }
            } catch (error) {
              console.error('[EditCategoryScreen] Error eliminando categoría:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido al eliminar la categoría');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.field}>
          <TextInput 
            value={name} 
            onChangeText={setName} 
            style={styles.input} 
            placeholder="Nombre de la Categoría"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <TextInput 
            value={description} 
            onChangeText={setDescription} 
            style={[styles.input, styles.textArea]} 
            placeholder="Descripción (Opcional)"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldGroupLabel}>Capacidad por Grupo</Text>
          <TextInput 
            value={capacity} 
            onChangeText={setCapacity} 
            style={styles.input} 
            keyboardType="numeric"
            placeholder="5"
            placeholderTextColor="#9ca3af"
          />
          <Text style={styles.fieldHint}>Número máximo de estudiantes por grupo</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldGroupLabel}>Tipo de Agrupamiento</Text>
          
          <TouchableOpacity 
            style={[styles.option, groupingType === 'aleatorio' && styles.optionSelected]}
            onPress={() => setGroupingType('aleatorio')}
          >
            <View style={styles.radio}>
              {groupingType === 'aleatorio' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, groupingType === 'aleatorio' && styles.optionTitleSelected]}>
                Aleatorio
              </Text>
              <Text style={styles.optionDescription}>Asigna automáticamente</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.option, groupingType === 'eleccion' && styles.optionSelected]}
            onPress={() => setGroupingType('eleccion')}
          >
            <View style={styles.radio}>
              {groupingType === 'eleccion' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, groupingType === 'eleccion' && styles.optionTitleSelected]}>
                Elección
              </Text>
              <Text style={styles.optionDescription}>Estudiantes eligen grupo</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Guardar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={handleDelete}>
          <Text style={styles.dangerButtonText}>Eliminar Categoría</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  container: { 
    padding: 20, 
    gap: 16 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  field: { 
    marginBottom: 16 
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldGroupLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  fieldHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  input: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  option: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7c3aed',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  optionTitleSelected: {
    color: '#7c3aed',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  dangerButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  actionButtonDanger: {
    backgroundColor: '#dc2626',
    marginRight: 0,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});
