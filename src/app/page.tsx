'use client'

import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    const guid = crypto.randomUUID()
    window.location.replace(`/${guid}`)
  }, [])

  return null
}
