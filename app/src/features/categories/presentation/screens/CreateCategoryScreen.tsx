import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Alert, TouchableOpacity } from 'react-native';
import { ActionButton } from '../../../courses/presentation/components/ActionButton';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCategoriesController } from '../hooks/useCategoriesController';

type GroupingType = 'aleatorio' | 'eleccion';

export function CreateCategoryScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('5');
  const [groupingType, setGroupingType] = useState<GroupingType>('aleatorio');
  const controller = useCategoriesController(courseId);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es requerido');
      return;
    }
    
    if (!courseId) {
      Alert.alert('Error', 'No se proporcionó el ID del curso');
      return;
    }

    const capacityNum = parseInt(capacity, 10);
    if (isNaN(capacityNum) || capacityNum < 1) {
      Alert.alert('Error', 'La capacidad debe ser un número mayor a 0');
      return;
    }

    const result = await controller.createCategory({ 
      name: name.trim(), 
      description: description.trim() || undefined,
      capacity: capacityNum,
      type: groupingType,
      courseId 
    });
    
    if (result) {
      Alert.alert('Éxito', 'Categoría creada correctamente');
      router.back();
    } else {
      Alert.alert('Error', 'No se pudo crear la categoría');
    }
  };

  const handleCancel = () => {
    router.back();
  };

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
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>Crear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
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
});
