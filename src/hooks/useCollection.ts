import { useEffect, useState } from 'react'
import { onSnapshot, type Query } from 'firebase/firestore'

export function useCollection<T>(ref: Query | null) {
  const [data, setData] = useState<(T & { id: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ref) return
    setLoading(true)
    return onSnapshot(ref, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })))
      setLoading(false)
    })
  }, [ref])

  return { data, loading }
}
