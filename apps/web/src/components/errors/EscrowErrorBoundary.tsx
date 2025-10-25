import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * エスクロー関連のエラーをキャッチするエラーバウンダリ
 */
export class EscrowErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EscrowErrorBoundary caught an error:', error, errorInfo)

    // エラーログをサーバーに送信（オプション）
    this.logErrorToService(error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: エラーログサービスへの送信実装
    // 例: Sentry, LogRocket, etc.
    try {
      fetch('/api/logs/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          },
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch((err) => {
        console.error('Failed to log error:', err)
      })
    } catch (err) {
      console.error('Failed to send error log:', err)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックがあれば使用
      if (this.props.fallback) {
        return this.props.fallback
      }

      // デフォルトのエラー表示
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <Card className="w-full max-w-2xl glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <CardTitle className="text-2xl text-white">
                  エラーが発生しました
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-white/80">
                  申し訳ございません。予期しないエラーが発生しました。
                </p>
                <p className="text-white/60 text-sm">
                  問題が解決しない場合は、サポートチームにお問い合わせください。
                </p>
              </div>

              {this.state.error && (
                <details className="glass p-4 rounded-lg">
                  <summary className="cursor-pointer text-white/80 font-medium mb-2">
                    エラー詳細
                  </summary>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-white/60">エラーメッセージ:</p>
                      <p className="text-red-400 font-mono mt-1">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-white/60">スタックトレース:</p>
                        <pre className="text-white/40 font-mono text-xs mt-1 overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  再試行
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                  className="flex-1 border-white/20 text-white"
                >
                  ホームに戻る
                </Button>
              </div>

              <div className="glass p-4 rounded-lg space-y-2">
                <p className="text-white/80 font-medium">
                  よくあるエラーと解決方法:
                </p>
                <ul className="text-sm text-white/60 space-y-1 list-disc list-inside">
                  <li>ウォレットが接続されているか確認してください</li>
                  <li>正しいネットワーク（Base Sepolia）に接続されているか確認してください</li>
                  <li>十分なガス代（ETH）があるか確認してください</li>
                  <li>ブラウザのキャッシュをクリアしてみてください</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * UserOperation関連のエラーを処理するヘルパー関数
 */
export const handleUserOperationError = (error: unknown): string => {
  if (error instanceof Error) {
    // UserOperation固有のエラー
    if (error.message.includes('insufficient funds')) {
      return 'ガス代が不足しています。ウォレットにETHを追加してください。'
    }
    if (error.message.includes('user rejected')) {
      return 'トランザクションがキャンセルされました。'
    }
    if (error.message.includes('nonce')) {
      return 'Nonceエラーが発生しました。もう一度お試しください。'
    }
    if (error.message.includes('gas')) {
      return 'ガス見積もりに失敗しました。パラメータを確認してください。'
    }
    if (error.message.includes('paymaster')) {
      return 'Paymasterエラーが発生しました。スポンサーシップが利用できない可能性があります。'
    }
    if (error.message.includes('signature')) {
      return '署名の検証に失敗しました。'
    }

    return error.message
  }

  return '不明なエラーが発生しました。'
}

/**
 * コントラクトエラーを処理するヘルパー関数
 */
export const handleContractError = (error: unknown): string => {
  if (error instanceof Error) {
    // Solidityのrevertメッセージをパース
    const revertMatch = error.message.match(/reverted with reason string '(.+)'/)
    if (revertMatch) {
      return revertMatch[1]
    }

    // カスタムエラーの処理
    if (error.message.includes('InsufficientApprovals')) {
      return '承認が不足しています。'
    }
    if (error.message.includes('EscrowNotFound')) {
      return 'エスクローが見つかりません。'
    }
    if (error.message.includes('AlreadyApproved')) {
      return 'すでに承認されています。'
    }
    if (error.message.includes('Unauthorized')) {
      return 'この操作を実行する権限がありません。'
    }
    if (error.message.includes('InvalidState')) {
      return 'エスクローの状態が無効です。'
    }
    if (error.message.includes('TimelockNotExpired')) {
      return 'タイムロックがまだ期限切れになっていません。'
    }

    return handleUserOperationError(error)
  }

  return '不明なエラーが発生しました。'
}
