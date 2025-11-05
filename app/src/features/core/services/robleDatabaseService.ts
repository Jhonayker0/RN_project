import { AxiosInstance } from "axios";
import { RobleConfig } from "../config/robleConfig";
import { robleHttpService } from "./robleHttpService";

export class RobleDatabaseService {
  constructor(private readonly client: AxiosInstance = robleHttpService.dio) {}

  async read(tableName: string): Promise<Record<string, any>[]> {
    try {
      const response = await this.client.get<Record<string, any>[] | any>(
        RobleConfig.readEndpoint,
        { params: { tableName } }
      );
      if (Array.isArray(response.data)) {
        return response.data as Record<string, any>[];
      }
      return [];
    } catch (error) {
      throw new Error(`Error al leer datos de ${tableName}: ${String(error)}`);
    }
  }

  async insert(
    tableName: string,
    records: Record<string, any>[]
  ): Promise<void> {
    try {
      await this.client.post(RobleConfig.insertEndpoint, {
        tableName,
        records,
      });
    } catch (error) {
      throw new Error(`Error al insertar en ${tableName}: ${String(error)}`);
    }
  }

  async update(
    tableName: string,
    id: string,
    updates: Record<string, any>
  ): Promise<void> {
    try {
      await this.client.put(RobleConfig.updateEndpoint, {
        tableName,
        idColumn: "_id",
        idValue: id,
        updates,
      });
    } catch (error) {
      throw new Error(`Error al actualizar ${tableName}: ${String(error)}`);
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    try {
      console.log('[RobleDatabaseService] DELETE request:', {
        endpoint: RobleConfig.deleteEndpoint,
        tableName,
        idColumn: "_id",
        idValue: id,
      });
      
      const response = await this.client.delete(RobleConfig.deleteEndpoint, {
        data: { tableName, idColumn: "_id", idValue: id },
      });
      
      console.log('[RobleDatabaseService] DELETE response:', response.data);
    } catch (error) {
      console.error('[RobleDatabaseService] DELETE error:', error);
      throw new Error(`Error al eliminar de ${tableName}: ${String(error)}`);
    }
  }
}

export const robleDatabaseService = new RobleDatabaseService();
