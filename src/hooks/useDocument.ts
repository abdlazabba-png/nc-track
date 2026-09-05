import { useEffect, useState } from 'react'
import { onSnapshot, type DocumentReference } from 'firebase/firestore'

export function useDocument<T>(ref: DocumentReference | null) {
  const [data, setData] = useState<(T & { id: string }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ref) return
    setLoading(true)
    return onSnapshot(ref, (snap) => {
      setData(snap.exists() ? { id: snap.id, ...(snap.data() as T) } : null)
      setLoading(false)
    })
  }, [ref])

  return { data, loading }
}
