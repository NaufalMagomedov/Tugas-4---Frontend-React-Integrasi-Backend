import { and, eq, ne, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { menuItems } from '../db/schema.ts';

export interface CreateMenuParams {
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean;
  imageUrl?: string | null;
}

export type UpdateMenuParams = Partial<Omit<CreateMenuParams, 'stallId'>>;

export class MenuItemRepository {
  async findByStallId(stallId: number) {
    const db = await getDb();
    return db.select().from(menuItems).where(eq(menuItems.stallId, stallId)).orderBy(menuItems.id);
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return rows[0];
  }

  /**
   * Cari menu bernama sama di warung yang sama (untuk pesan 409 yang jelas).
   * SQL Server memakai collation case-insensitive secara default, jadi
   * "Es Teh" dan "es teh" dianggap sama. `exceptId` dipakai saat update supaya
   * menu tidak dianggap bentrok dengan dirinya sendiri.
   */
  async findByStallAndName(stallId: number, name: string, exceptId?: number) {
    const db = await getDb();
    const conditions: SQL[] = [eq(menuItems.stallId, stallId), eq(menuItems.name, name)];
    if (exceptId !== undefined) conditions.push(ne(menuItems.id, exceptId));

    const rows = await db
      .select()
      .from(menuItems)
      .where(and(...conditions));
    return rows[0];
  }

  async create(params: CreateMenuParams) {
    const db = await getDb();
    const rows = await db
      .insert(menuItems)
      .output()
      .values({
        stallId: params.stallId,
        name: params.name,
        price: params.price,
        isAvailable: params.isAvailable,
        imageUrl: params.imageUrl || null,
      });
    return rows[0];
  }

  async update(id: number, params: UpdateMenuParams) {
    const db = await getDb();
    const rows = await db
      .update(menuItems)
      .set({
        ...(params.name !== undefined ? { name: params.name } : {}),
        ...(params.price !== undefined ? { price: params.price } : {}),
        ...(params.isAvailable !== undefined ? { isAvailable: params.isAvailable } : {}),
        ...(params.imageUrl !== undefined ? { imageUrl: params.imageUrl || null } : {}),
      })
      .where(eq(menuItems.id, id))
      .output();
    return rows[0];
  }

  async remove(id: number) {
    const db = await getDb();
    const rows = await db.delete(menuItems).where(eq(menuItems.id, id)).output();
    return rows[0];
  }
}
