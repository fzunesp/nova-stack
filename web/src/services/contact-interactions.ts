import pb from '@/lib/pocketbase'
import type { ContactInteraction, InteractionType } from './types'

export async function getContactInteractions(contactId: string): Promise<ContactInteraction[]> {
  const records = await pb.collection('contact_interactions').getList(1, 500, {
    sort: '-created',
  })
  return records.items
    .filter((r) => r.contactId === contactId)
    .map((r) => ({
    id: r.id,
    contactId: r.contactId,
    userId: r.userId,
    content: r.content,
    type: r.type as InteractionType,
    created: r.created,
    updated: r.updated,
  }))
}

export async function createContactInteraction(data: {
  contactId: string
  content: string
  type: InteractionType
}): Promise<ContactInteraction> {
  const r = await pb.collection('contact_interactions').create({
    ...data,
    userId: pb.authStore.record?.id,
  })
  return {
    id: r.id,
    contactId: r.contactId,
    userId: r.userId,
    content: r.content,
    type: r.type as InteractionType,
    created: r.created,
    updated: r.updated,
  }
}

export async function updateContactInteraction(
  id: string,
  data: { content?: string; type?: InteractionType }
): Promise<ContactInteraction> {
  const r = await pb.collection('contact_interactions').update(id, data)
  return {
    id: r.id,
    contactId: r.contactId,
    userId: r.userId,
    content: r.content,
    type: r.type as InteractionType,
    created: r.created,
    updated: r.updated,
  }
}

export async function deleteContactInteraction(id: string): Promise<void> {
  await pb.collection('contact_interactions').delete(id)
}
