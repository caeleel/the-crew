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

let connectTimeout: any = null

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

    const keepalive = setInterval(() => {
      if (localSocket.readyState !== localSocket.OPEN) {
        clearInterval(keepalive)
      } else {
        localSocket.send(JSON.stringify({ type: 'ping' }))
      }
    }, 1000)
  }

  localSocket.onclose = (e) => {
    console.log('closing socket:', e)
    if (connectTimeout) {
      clearTimeout(connectTimeout)
    }
    connectTimeout = setTimeout(() => {
      connect(callback, channel)
    }, 1000)
  }

  localSocket.onerror = (e) => {
    console.log('error on socket:', e)
    localSocket!.close()
  }

  localSocket.onmessage = (e) => {
    callback(JSON.parse(e.data))
  }

  socket = localSocket
}
