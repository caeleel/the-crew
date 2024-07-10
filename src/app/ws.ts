import { getLocalStorage, setLocalStorage } from './local-storage'

export let socket: WebSocket | null = null
export let guid = getLocalStorage('guid')
if (!guid) {
  guid = crypto.randomUUID()
  setLocalStorage('guid', guid)
}

export function send(data: any) {
  socket!.send(JSON.stringify(data))
}

export function connect(callback: (msg: any) => void, channel?: string) {
  if (!channel) {
    return
  }

  const localSocket = new WebSocket('wss://splendorlord.xyz/the-crew')

  localSocket.onopen = () => {
    localSocket.send(
      JSON.stringify({
        type: 'subscribe',
        channel,
        guid,
      }),
    )
  }

  localSocket.onclose = (e) => {
    setTimeout(() => {
      connect(callback, channel)
    }, 1000)
  }

  localSocket.onerror = (e) => {
    localSocket!.close()
  }

  localSocket.onmessage = (e) => {
    callback(JSON.parse(e.data))
  }

  socket = localSocket
}
