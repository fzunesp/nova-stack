import pb from '@/lib/pocketbase'
import type { ListParams, ListResult, Status } from './types'
import { validateRequired, validateNoUnknownFields, validateStatusTransition } from './validation'


export abstract class BaseService<T extends { id: string; status: Status }> {
  protected abstract collection: string
  protected abstract allowedFields: (keyof T)[]
  protected abstract requiredCreateFields: (keyof T)[]
  protected entityType: string

  constructor(entityType: string) {
    this.entityType = entityType
  }

  protected validateCreate(data: Partial<T>): T {
    validateNoUnknownFields(data, this.allowedFields)
    validateRequired(data as any, this.requiredCreateFields)
    return data as T
  }

  protected validateUpdate(current: T, data: Partial<T>): Partial<T> {
    validateNoUnknownFields(data, this.allowedFields)
    if (data.status !== undefined && data.status !== current.status) {
      validateStatusTransition(current.status, data.status, this.entityType)
    }
    return data
  }

  async create(data: Partial<T>, actorId: string): Promise<T> {
    const validated = this.validateCreate(data)
    const record = await pb.collection(this.collection).create({
      ...validated,
      created_by: actorId,
    })
    return record as unknown as T
  }

  async update(id: string, data: Partial<T>, _actorId: string): Promise<T> {
    const current = await this.getById(id)
    const validated = this.validateUpdate(current, data)
    const record = await pb.collection(this.collection).update(id, validated)
    return record as unknown as T
  }

  async delete(id: string): Promise<void> {
    await pb.collection(this.collection).delete(id)
  }

  async getById(id: string): Promise<T> {
    const record = await pb.collection(this.collection).getOne(id)
    return record as unknown as T
  }

  async getList(params: ListParams): Promise<ListResult<T>> {
    const { page = 1, perPage = 10, sort = '-id', search, searchFields } = params
    let filter = params.filter

    if (search && searchFields?.length) {
      const terms = searchFields.map((f) => `${f}~"${search.trim()}"`)
      filter = terms.join('||')
    }

    const result = await pb.collection(this.collection).getList(page, perPage, {
      sort,
      filter: filter || undefined,
    })

    return {
      items: result.items as unknown as T[],
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage,
    }
  }

  async getAll(sort = '-id'): Promise<T[]> {
    const records = await pb.collection(this.collection).getFullList({ sort })
    return records as unknown as T[]
  }
}
