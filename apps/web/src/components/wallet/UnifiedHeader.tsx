/**
 * UnifiedHeader
 *
 * 統合型ヘッダー：タイトル、ウォレット接続、ロール選択、コントラクト情報を1つにまとめたコンポーネント
 */

import { useState } from 'react'
import { useAccount, useChainId, useDisconnect, useSwitchChain } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useReadEscrowRegistry } from '@/hooks/contracts/useEscrowRegistry'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Copy,
  ExternalLink,
  LogOut,
  Network,
  Check,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react'

interface UnifiedHeaderProps {}

export function UnifiedHeader({}: UnifiedHeaderProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { chains, switchChain } = useSwitchChain()
  const { address: contractAddress } = useReadEscrowRegistry()
  const [copied, setCopied] = useState(false)
  const [copiedContract, setCopiedContract] = useState(false)

  const getChainName = () => {
    if (chainId === 8453) return 'Base Mainnet'
    if (chainId === 84532) return 'Base Sepolia'
    return `Chain ${chainId}`
  }

  const getExplorerUrl = (addr: string) => {
    if (chainId === 8453) {
      return `https://basescan.org/address/${addr}`
    }
    return `https://sepolia.basescan.org/address/${addr}`
  }

  const copyToClipboard = async (text: string, isContract = false) => {
    await navigator.clipboard.writeText(text)
    if (isContract) {
      setCopiedContract(true)
      setTimeout(() => setCopiedContract(false), 2000)
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header - Outside Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/'}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Group Wallet Organizer
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Unlock, Pay, and Organize — Together.</p>
          </div>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div className="relative rounded-lg border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-px">
        <div className="bg-background rounded-md p-4 sm:p-6">
          {/* Wallet Connection Row */}
          <div className="flex items-center justify-start">
            {/* Wallet Connection */}
            <div className="flex items-center gap-2 sm:gap-3">
            {/* Wallet Connection Button */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading'
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus || authenticationStatus === 'authenticated')

                if (!connected) {
                  return (
                    <Button onClick={openConnectModal} className="gradient-primary text-white">
                      Connect Wallet
                    </Button>
                  )
                }

                if (chain.unsupported) {
                  return (
                    <Button onClick={openChainModal} variant="destructive">
                      Wrong Network
                    </Button>
                  )
                }

                return (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              overflow: 'hidden',
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 16, height: 16 }}
                              />
                            )}
                          </div>
                        )}
                        <span className="font-medium">{chain.name}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuItem
                        onClick={() => window.open(getExplorerUrl(account.address), '_blank')}
                        className="cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Explorer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {chains && chains.length > 1 && (
                        <>
                          <div className="px-2 py-1.5">
                            <p className="text-xs text-muted-foreground mb-1">Switch Network</p>
                          </div>
                          {chains.map((chainOption) => (
                            <DropdownMenuItem
                              key={chainOption.id}
                              onClick={() => switchChain?.({ chainId: chainOption.id })}
                              className="cursor-pointer"
                            >
                              <Network className="h-4 w-4 mr-2" />
                              {chainOption.name}
                              {chainOption.id === chain.id && <Check className="h-4 w-4 ml-auto" />}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => disconnect()}
                        className="cursor-pointer text-red-600"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }}
            </ConnectButton.Custom>
            </div>
          </div>

          {/* Contract Information Row */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 text-sm mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
            {/* Your Address - Left Side */}
            {isConnected && address && (
              <div className="w-full sm:w-auto">
                <p className="text-xs text-muted-foreground mb-1">Your Address</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {address}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(address)}
                    className="h-7 w-7 p-0"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Contract Address - Right Side */}
            <div className="w-full sm:w-auto">
              <p className="text-xs text-muted-foreground mb-1">EscrowRegistry Contract</p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {contractAddress}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(contractAddress, true)}
                  className="h-7 w-7 p-0"
                >
                  {copiedContract ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(contractAddress), '_blank')}
                  className="h-7 w-7 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
