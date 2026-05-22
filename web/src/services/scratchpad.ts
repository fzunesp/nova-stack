import pb from '@/lib/pocketbase'

export interface Scratchpad {
  id: string
  userId: string
  content: string
  created: string
  updated: string
}

export async function getScratchpad(userId: string): Promise<Scratchpad | null> {
  try {
    const records = await pb.collection('scratchpad').getList(1, 1, {
      filter: `userId = "${userId}"`,
    })
    if (records.items.length === 0) return null
    const r = records.items[0]
    return {
      id: r.id,
      userId: r.userId,
      content: r.content || '',
      created: r.created,
      updated: r.updated,
    }
  } catch {
    return null
  }
}

export async function createScratchpad(data: { userId: string; content: string }): Promise<Scratchpad> {
  const r = await pb.collection('scratchpad').create(data)
  return {
    id: r.id,
    userId: r.userId,
    content: r.content || '',
    created: r.created,
    updated: r.updated,
  }
}

export async function updateScratchpad(id: string, data: { content: string }): Promise<Scratchpad> {
  const r = await pb.collection('scratchpad').update(id, data)
  return {
    id: r.id,
    userId: r.userId,
    content: r.content || '',
    created: r.created,
    updated: r.updated,
  }
}

export async function upsertScratchpad(userId: string, content: string): Promise<Scratchpad> {
  const existing = await getScratchpad(userId)
  if (existing) {
    return updateScratchpad(existing.id, { content })
  }
  return createScratchpad({ userId, content })
}
