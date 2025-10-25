import { useState, useCallback, useEffect } from 'react'

/**
 * Web Push通知のサブスクリプション情報
 */
export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Web Push通知を管理するカスタムフック
 */
export const useWebPush = (userId?: string) => {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  // VAPID公開鍵（環境変数から取得）
  const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

  /**
   * URLBase64をUint8Arrayに変換
   */
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  /**
   * ブラウザがPush通知をサポートしているかチェック
   */
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
    } else {
      setIsSupported(false)
    }
  }, [])

  /**
   * 現在のサブスクリプション状態をチェック
   */
  const checkSubscription = useCallback(async () => {
    if (!isSupported) return

    try {
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()

      if (existingSubscription) {
        setIsSubscribed(true)
        setSubscription({
          endpoint: existingSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(existingSubscription.getKey('auth')!),
          },
        })
      } else {
        setIsSubscribed(false)
        setSubscription(null)
      }
    } catch (err) {
      console.error('Failed to check subscription:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    }
  }, [isSupported])

  /**
   * ArrayBufferをBase64に変換
   */
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  /**
   * Push通知を購読
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser')
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VAPID public key is not configured')
    }

    if (!userId) {
      throw new Error('User ID is required')
    }

    try {
      setIsLoading(true)
      setError(null)

      // Service Workerを登録
      let registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js')
      }

      // 通知権限をリクエスト
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      // Push通知を購読
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const subscriptionData: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!),
        },
      }

      // サーバーにサブスクリプションを保存
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription: subscriptionData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription to server')
      }

      setSubscription(subscriptionData)
      setIsSubscribed(true)

      console.log('Successfully subscribed to push notifications')
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, VAPID_PUBLIC_KEY, userId])

  /**
   * Push通知の購読を解除
   */
  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser')
    }

    if (!userId) {
      throw new Error('User ID is required')
    }

    try {
      setIsLoading(true)
      setError(null)

      const registration = await navigator.serviceWorker.ready
      const pushSubscription = await registration.pushManager.getSubscription()

      if (pushSubscription) {
        await pushSubscription.unsubscribe()

        // サーバーからサブスクリプションを削除
        const response = await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
          throw new Error('Failed to remove subscription from server')
        }

        setSubscription(null)
        setIsSubscribed(false)

        console.log('Successfully unsubscribed from push notifications')
      }
    } catch (err) {
      console.error('Failed to unsubscribe from push notifications:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, userId])

  /**
   * テスト通知を送信
   */
  const sendTestNotification = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID is required')
    }

    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to send test notification')
      }

      console.log('Test notification sent')
    } catch (err) {
      console.error('Failed to send test notification:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    }
  }, [userId])

  // マウント時にサブスクリプション状態をチェック
  useEffect(() => {
    if (isSupported) {
      checkSubscription()
    }
  }, [isSupported, checkSubscription])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscription,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkSubscription,
  }
}
