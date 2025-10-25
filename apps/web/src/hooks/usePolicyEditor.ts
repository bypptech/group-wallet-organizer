import { useState, useCallback, useEffect } from 'react'
import { useAaClient } from './useAaClient'
import { getPoliciesByVault, type Policy } from '@/lib/graphql'
import type { Address } from 'viem'

/**
 * ポリシー情報の型定義
 */
export interface PolicyConfig {
  minApprovals: number
  maxAmount: bigint
  cooldownPeriod: number
  enabled: boolean
}

/**
 * ポリシー編集を管理するカスタムフック
 */
export const usePolicyEditor = (vaultAddress?: Address) => {
  const { writeContract, isReady: isAaReady } = useAaClient()

  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * ポリシー一覧を取得
   */
  const fetchPolicies = useCallback(async () => {
    if (!vaultAddress) {
      console.warn('Vault address not provided')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await getPoliciesByVault(vaultAddress)
      setPolicies(data)
    } catch (err) {
      console.error('Failed to fetch policies:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [vaultAddress])

  /**
   * ポリシーを更新
   */
  const updatePolicy = useCallback(
    async (
      policyManagerAddress: Address,
      policyManagerAbi: any,
      policyId: string,
      config: PolicyConfig
    ) => {
      if (!isAaReady) {
        throw new Error('AA Client not ready')
      }

      try {
        setIsSaving(true)
        setError(null)

        const txHash = await writeContract(
          policyManagerAddress,
          policyManagerAbi,
          'updatePolicy',
          [
            BigInt(policyId),
            config.minApprovals,
            config.maxAmount,
            config.cooldownPeriod,
            config.enabled,
          ]
        )

        console.log('Policy updated:', txHash)

        // データを更新
        await fetchPolicies()

        return txHash
      } catch (err) {
        console.error('Failed to update policy:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [isAaReady, writeContract, fetchPolicies]
  )

  /**
   * 新しいポリシーを作成
   */
  const createPolicy = useCallback(
    async (
      policyManagerAddress: Address,
      policyManagerAbi: any,
      config: PolicyConfig
    ) => {
      if (!isAaReady) {
        throw new Error('AA Client not ready')
      }

      if (!vaultAddress) {
        throw new Error('Vault address not provided')
      }

      try {
        setIsSaving(true)
        setError(null)

        const txHash = await writeContract(
          policyManagerAddress,
          policyManagerAbi,
          'createPolicy',
          [
            vaultAddress,
            config.minApprovals,
            config.maxAmount,
            config.cooldownPeriod,
            config.enabled,
          ]
        )

        console.log('Policy created:', txHash)

        // データを更新
        await fetchPolicies()

        return txHash
      } catch (err) {
        console.error('Failed to create policy:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [isAaReady, vaultAddress, writeContract, fetchPolicies]
  )

  /**
   * ポリシーを削除（無効化）
   */
  const deletePolicy = useCallback(
    async (
      policyManagerAddress: Address,
      policyManagerAbi: any,
      policyId: string
    ) => {
      if (!isAaReady) {
        throw new Error('AA Client not ready')
      }

      try {
        setIsSaving(true)
        setError(null)

        const txHash = await writeContract(
          policyManagerAddress,
          policyManagerAbi,
          'disablePolicy',
          [BigInt(policyId)]
        )

        console.log('Policy disabled:', txHash)

        // データを更新
        await fetchPolicies()

        return txHash
      } catch (err) {
        console.error('Failed to disable policy:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [isAaReady, writeContract, fetchPolicies]
  )

  /**
   * ポリシーを有効化
   */
  const enablePolicy = useCallback(
    async (
      policyManagerAddress: Address,
      policyManagerAbi: any,
      policyId: string
    ) => {
      if (!isAaReady) {
        throw new Error('AA Client not ready')
      }

      try {
        setIsSaving(true)
        setError(null)

        const txHash = await writeContract(
          policyManagerAddress,
          policyManagerAbi,
          'enablePolicy',
          [BigInt(policyId)]
        )

        console.log('Policy enabled:', txHash)

        // データを更新
        await fetchPolicies()

        return txHash
      } catch (err) {
        console.error('Failed to enable policy:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [isAaReady, writeContract, fetchPolicies]
  )

  /**
   * 初回マウント時にポリシーを取得
   */
  useEffect(() => {
    if (vaultAddress) {
      fetchPolicies()
    }
  }, [vaultAddress, fetchPolicies])

  return {
    policies,
    isLoading,
    isSaving,
    error,
    fetchPolicies,
    updatePolicy,
    createPolicy,
    deletePolicy,
    enablePolicy,
  }
}

/**
 * ポリシー検証を行うカスタムフック
 */
export const usePolicyValidator = () => {
  /**
   * ポリシー設定が有効かどうかを検証
   */
  const validatePolicy = useCallback((config: PolicyConfig): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    // 最小承認数の検証
    if (config.minApprovals < 1) {
      errors.push('Minimum approvals must be at least 1')
    }

    // 最大金額の検証
    if (config.maxAmount <= 0n) {
      errors.push('Maximum amount must be greater than 0')
    }

    // クールダウン期間の検証
    if (config.cooldownPeriod < 0) {
      errors.push('Cooldown period cannot be negative')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }, [])

  /**
   * エスクローがポリシーに適合するかを検証
   */
  const validateEscrowAgainstPolicy = useCallback(
    (
      escrowAmount: bigint,
      escrowApprovals: number,
      policy: PolicyConfig
    ): { valid: boolean; errors: string[] } => {
      const errors: string[] = []

      // ポリシーが無効の場合
      if (!policy.enabled) {
        errors.push('Policy is disabled')
      }

      // 金額チェック
      if (escrowAmount > policy.maxAmount) {
        errors.push(`Amount exceeds policy maximum (${policy.maxAmount.toString()})`)
      }

      // 承認数チェック
      if (escrowApprovals < policy.minApprovals) {
        errors.push(`Insufficient approvals (required: ${policy.minApprovals})`)
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    },
    []
  )

  return {
    validatePolicy,
    validateEscrowAgainstPolicy,
  }
}

/**
 * ポリシーテンプレート機能
 */
export const usePolicyTemplates = () => {
  /**
   * 事前定義されたポリシーテンプレート
   */
  const templates: Record<string, PolicyConfig> = {
    strict: {
      minApprovals: 3,
      maxAmount: BigInt('1000000000000000000'), // 1 ETH
      cooldownPeriod: 86400, // 24 hours
      enabled: true,
    },
    moderate: {
      minApprovals: 2,
      maxAmount: BigInt('5000000000000000000'), // 5 ETH
      cooldownPeriod: 3600, // 1 hour
      enabled: true,
    },
    relaxed: {
      minApprovals: 1,
      maxAmount: BigInt('10000000000000000000'), // 10 ETH
      cooldownPeriod: 0,
      enabled: true,
    },
  }

  /**
   * テンプレートを取得
   */
  const getTemplate = useCallback(
    (templateName: keyof typeof templates): PolicyConfig => {
      return templates[templateName]
    },
    [templates]
  )

  /**
   * テンプレート一覧を取得
   */
  const listTemplates = useCallback(() => {
    return Object.keys(templates)
  }, [templates])

  return {
    templates,
    getTemplate,
    listTemplates,
  }
}

/**
 * ポリシー変更履歴を管理するカスタムフック
 */
export const usePolicyHistory = (vaultAddress?: Address) => {
  const [history, setHistory] = useState<
    Array<{
      timestamp: number
      action: 'create' | 'update' | 'enable' | 'disable'
      policyId: string
      changes: Partial<PolicyConfig>
    }>
  >([])

  /**
   * 変更履歴を追加
   */
  const addHistoryEntry = useCallback(
    (
      action: 'create' | 'update' | 'enable' | 'disable',
      policyId: string,
      changes: Partial<PolicyConfig>
    ) => {
      setHistory((prev) => [
        {
          timestamp: Date.now(),
          action,
          policyId,
          changes,
        },
        ...prev,
      ])
    },
    []
  )

  /**
   * 履歴をクリア
   */
  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return {
    history,
    addHistoryEntry,
    clearHistory,
  }
}
