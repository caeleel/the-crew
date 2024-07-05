'use client';

import { useEffect } from "react";

let guid = localStorage.getItem('guid')
if (!guid) {
  guid = crypto.randomUUID()
  localStorage.setItem('guid', guid)
}

function connect(callback: (msg: any) => void, channel?: string) {
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
      channel,
    })
  }

  socket.onclose = (e) => {
    setTimeout(() => {
      connect(callback, channel)
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
  console.log(document.location.href)
  const channel = 'hello-world'

  useEffect(() => {
    console.log('connecting...')
    connect((msg) => {
      console.log(msg)
    }, channel)
  }, [channel])
}