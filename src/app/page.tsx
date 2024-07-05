'use client';

import { useEffect } from "react";

let guid = localStorage.getItem('guid')
if (!guid) {
  guid = crypto.randomUUID()
  localStorage.setItem('guid', guid)
}

function connect(callback: (msg: any) => void, name: string, channel?: string) {
  if (!channel) {
    return
  }

  const socket = new WebSocket("wss://splendorlord.xyz/the-crew")

  function send(data: any) {
    socket.send(JSON.stringify(data))
  }

  socket.onopen = () => {
    send({
      type: 'subscribe',
      guid,
      name,
      channel,
    })
  }

  socket.onclose = (e) => {
    setTimeout(() => {
      connect(callback, name, channel)
    }, 1000)
  }

  socket.onerror = (e) => {
    socket.close()
  }

  socket.onmessage = (e) => {
    callback(e.data)
  }
}

export default function Page() {
  const query = document.location.href.split('?', 2)[1].split('&')
  const queryMap: { [k: string]: string } = {}
  for (const item of query) {
    const [k, v] = item.split('=')
    queryMap[k] = v
  }
  const name = queryMap['n'] || 'Anonymous'
  const channel = queryMap['c']

  useEffect(() => {
    console.log('connecting...', name, channel)
    connect((msg) => {
      console.log(msg)
    }, name, channel)
  }, [name, channel])
}