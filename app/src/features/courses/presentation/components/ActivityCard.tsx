import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EvaluatePeersModal } from '../../../activities/presentation/components/EvaluatePeersModal';
import { ViewGradesModal } from '../../../activities/presentation/components/ViewGradesModal';

interface Props {
  activity: Record<string, any>;
  isProfessor: boolean;
  currentUserId: string;
}

export function ActivityCard({ activity, isProfessor, currentUserId }: Props) {
  const [showEvaluatePeers, setShowEvaluatePeers] = useState(false);
  const [showViewGrades, setShowViewGrades] = useState(false);

  const id = (activity['_id'] ?? activity['id']) as string;
  const title = (activity['title'] ?? activity['name'] ?? 'Actividad') as string;
  const description = activity['description'] as string | undefined;
  const due = activity['formatted_due_date'] ?? formatDate(activity['due_date']);
  const category = activity['category_name'] ?? 'Sin categoría';
  const categoryId = activity['category_id'] as string;

  // Determinar si es una actividad expandible (con botones)
  const isExpandable = !!categoryId;

  const handleRefreshAfterEvaluation = () => {
    // Aquí podrías recargar las actividades si es necesario
    console.log('✅ Evaluación completada');
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={24} color="#2563eb" />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardMeta}>Categoría: {category}</Text>
          </View>
        </View>

        {description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          </View>
        )}

        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.metaText}>Fecha límite: {due ?? '-'}</Text>
          </View>
        </View>

        {isExpandable && (
          <View style={styles.actionsContainer}>
            {isProfessor ? (
              <>
                {/* Botón Ver notas - Solo profesor */}
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.viewGradesButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={() => setShowViewGrades(true)}
                >
                  <Ionicons name="stats-chart" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Ver notas</Text>
                </Pressable>

                {/* TODO: Botón Borrar actividad */}
                {/* <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={() => {}}
                >
                  <Ionicons name="trash-outline" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Borrar</Text>
                </Pressable> */}
              </>
            ) : (
              <>
                {/* Botón Evaluar compañeros - Solo estudiante */}
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.evaluateButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={() => setShowEvaluatePeers(true)}
                >
                  <Ionicons name="people" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Evaluar a mis compañeros</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </View>

      {/* Modals */}
      {!isProfessor && (
        <EvaluatePeersModal
          visible={showEvaluatePeers}
          onClose={() => setShowEvaluatePeers(false)}
          activity={{
            _id: id,
            title,
            description,
            category_id: categoryId,
            category_name: category,
          }}
          currentUserId={currentUserId}
          onSuccess={handleRefreshAfterEvaluation}
        />
      )}

      {isProfessor && (
        <ViewGradesModal
          visible={showViewGrades}
          onClose={() => setShowViewGrades(false)}
          activity={{
            _id: id,
            title,
            description,
          }}
        />
      )}
    </>
  );
}

function formatDate(date: any): string | null {
  if (!date) return null;
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  descriptionContainer: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  metaContainer: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  viewGradesButton: {
    backgroundColor: '#2563eb', // Blue
  },
  evaluateButton: {
    backgroundColor: '#2563eb', // Blue
  },
  deleteButton: {
    backgroundColor: '#ef4444', // Red
  },
});
