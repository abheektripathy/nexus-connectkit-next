"use client";

import { useEffect, useState, useCallback } from "react";
import { useNexus } from "@/providers/nexus";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";
import Image from "next/image";
import { useAaveDeposit } from "@/hooks/useAaveDeposit";
import { toast } from "sonner";
import BridgeModal from "@/components/BridgeModal";
import ExecuteModal from "@/components/ExecuteModal";

interface ChainBreakdown {
  balance: string;
  balanceInFiat: number;
  chain: {
    id: number;
    logo: string;
    name: string;
  };
  contractAddress: string;
  decimals: number;
  universe: number;
}

interface UserAsset {
  symbol: string;
  balance: string;
  decimals: number;
  name?: string;
  chainId?: number;
  icon?: string;
  breakdown?: ChainBreakdown[];
}

export default function BalanceDashboard() {
  const [unifiedBalance, setUnifiedBalance] = useState<UserAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const { nexusSDK } = useNexus();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const totalUSDC = unifiedBalance
    .filter((asset) => asset.symbol === "USDC")
    .reduce((sum, asset) => {
      return sum + parseFloat(asset.balance);
    }, 0);

  const reservedAmount = 0.5;
  const availableUSDC = Math.max(0, totalUSDC - reservedAmount);
  const [depositAmount, setDepositAmount] = useState("1");

  const {
    executeDeposit,
    isLoading: isDepositing,
    currentStep,
    simulation,
    simulateDeposit,
    isSimulating,
    multiStepResult,
  } = useAaveDeposit(depositAmount);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const fetchUnifiedBalance = useCallback(async () => {
    console.log("whay", nexusSDK, isConnected);
    if (!nexusSDK || !isConnected) {
      setIsInitializing(false);
      return;
    }

    setIsLoading(true);
    setIsInitializing(false);
    try {
      const balance = await nexusSDK.getUnifiedBalances();
      console.log("Unified Balance:", balance);
      setUnifiedBalance(balance || []);
    } catch (error) {
      console.error("Error fetching unified balance:", error);
      setUnifiedBalance([]);
    } finally {
      setIsLoading(false);
    }
  }, [nexusSDK, isConnected]);

  useEffect(() => {
    if (isConnected && !nexusSDK) {
      setIsInitializing(true);
    } else {
      fetchUnifiedBalance();
    }
  }, [fetchUnifiedBalance, isConnected, nexusSDK]);

  const handleAaveDeposit = useCallback(async () => {
    if (!nexusSDK || !isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid deposit amount");
      return;
    }

    if (parseFloat(depositAmount) > availableUSDC) {
      toast.error("Insufficient balance");
      return;
    }

    const simSuccess = await simulateDeposit();
    if (!simSuccess) {
      return;
    }

    setShowConfirmDialog(true);
  }, [nexusSDK, isConnected, simulateDeposit, depositAmount, availableUSDC]);

  const handleConfirmDeposit = useCallback(async () => {
    setShowConfirmDialog(false);
    const result = await executeDeposit();
    if (result.success) {
      fetchUnifiedBalance();
    }
  }, [executeDeposit, fetchUnifiedBalance]);

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    return num.toFixed(Math.min(6, decimals));
  };

  const getRouteInfo = () => {
    if (!multiStepResult?.bridgeSimulation?.intent) return null;

    const intent = multiStepResult.bridgeSimulation.intent;
    return {
      sources: intent.sources || [],
      allSources: intent.allSources || [],
      destination: intent.destination,
      token: intent.token,
    };
  };

  const routeInfo = getRouteInfo();

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
            <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            <div className="h-6 w-96 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
          </div>
          <div className="h-12 w-40 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-full" />
        </main>
      </div>
    );
  }

  const SkeletonGrid = () => (
    <div className="grid grid-cols-3 gap-4">
      {[...Array(9)].map((_, index) => (
        <div
          key={index}
          className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center text-center min-h-[120px]"
        >
          <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-2" />
          <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-2" />
          <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col justify-between py-20 px-16 bg-white dark:bg-black">
        {/* Header with logos and address */}
        <div className="flex w-full items-center justify-between mb-16">
          <div className="flex items-center gap-6">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={100}
              height={20}
              priority
            />
            <span className="text-zinc-400 dark:text-zinc-600">+</span>
            <Image
              src="/connectkit-logo.png"
              alt="ConnectKit logo"
              width={40}
              height={40}
              priority
            />
            <span className="text-zinc-400 dark:text-zinc-600">+</span>
            <Image
              src="/avail-logo.png"
              className="rounded-lg!"
              alt="Avail logo"
              width={40}
              height={40}
              priority
            />
          </div>
          {isConnected && address && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-zinc-500 dark:text-zinc-500">
                {formatAddress(address)}
              </div>
              <button
                onClick={() => disconnect()}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Disconnect wallet"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-zinc-500 dark:text-zinc-500"
                >
                  <path
                    d="M1 1L13 13M1 13L13 1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex flex-col items-center gap-8 text-center sm:items-start sm:text-left w-full flex-1">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Your Unified Balance Across 15+ Chains
          </h1>

          {isConnected ? (
            <div className="w-full h-[400px] overflow-y-auto pr-2">
              {isInitializing || isLoading ? (
                <SkeletonGrid />
              ) : unifiedBalance.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {unifiedBalance.map((asset, index) => {
                    // Filter breakdown to only show chains with non-zero balance
                    const nonZeroChains =
                      asset.breakdown?.filter(
                        (b) => parseFloat(b.balance) > 0,
                      ) || [];

                    return (
                      <div
                        key={`${asset.symbol}-${asset.chainId || index}-${index}`}
                        className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center text-center min-h-[120px]"
                      >
                        <div className="flex flex-row items-center justify-center space-x-2">
                          {asset.icon && (
                            <img
                              src={asset.icon}
                              className="w-5 rounded-lg h-5"
                              alt={asset.symbol}
                            />
                          )}
                          <h3 className="font-semibold text-lg text-black dark:text-zinc-50">
                            {asset.symbol}
                          </h3>
                        </div>

                        <p className="font-mono text-sm text-black dark:text-zinc-50 mb-2">
                          {formatBalance(asset.balance, asset.decimals)}
                        </p>

                        {/* Show chain sources with logos */}
                        {nonZeroChains.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center mt-2">
                            {nonZeroChains.map((breakdown, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
                                title={`${breakdown.chain.name}: ${parseFloat(breakdown.balance).toFixed(4)}`}
                              >
                                <img
                                  src={breakdown.chain.logo}
                                  alt={breakdown.chain.name}
                                  className="w-3 h-3 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Crect width='12' height='12' fill='%23ccc'/%3E%3C/svg%3E";
                                  }}
                                />
                                <span className="text-[10px] text-zinc-600 dark:text-zinc-400">
                                  {parseFloat(breakdown.balance).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {asset.name && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-full mt-1">
                            {asset.name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-600 dark:text-zinc-400">
                  No balances found
                </p>
              )}
            </div>
          ) : (
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Connect your wallet to view your unified balance across chains
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row pt-8">
          {isConnected ? (
            <div className="w-screen flex flex-row  space-x-4">
              {/*<button
                onClick={fetchUnifiedBalance}
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Refetching..." : "Refetch"}
              </button>*/}

              <div className="flex gap-3 items-center">
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="0.000001"
                    step="0.000001"
                    max={availableUSDC.toString()}
                    className="h-12 rounded-full px-4 pr-16 w-64 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 text-black dark:text-white"
                    placeholder="Amount"
                    disabled={
                      isLoading ||
                      isDepositing ||
                      isSimulating ||
                      availableUSDC <= 0
                    }
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                    USDC
                  </span>
                </div>

                <button
                  onClick={handleAaveDeposit}
                  disabled={
                    isLoading ||
                    isDepositing ||
                    isSimulating ||
                    availableUSDC <= 0 ||
                    parseFloat(depositAmount) <= 0 ||
                    parseFloat(depositAmount) > availableUSDC
                  }
                  className="flex h-12 w-48 items-center justify-center gap-2 rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDepositing ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="text-sm">
                        {currentStep || "Processing..."}
                      </span>
                    </span>
                  ) : isSimulating ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Simulating...
                    </span>
                  ) : availableUSDC <= 0 ? (
                    totalUSDC > 0 ? (
                      "Insufficient USDC (need > 0.5)"
                    ) : (
                      "No USDC Available"
                    )
                  ) : (
                    `Deposit to AAVE`
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowBridgeModal(true)}
                disabled={isLoading}
                className="flex h-12 w-40 items-center justify-center gap-2 rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bridge
              </button>
            </div>
          ) : (
            <ConnectKitButton.Custom>
              {({ show }) => (
                <button
                  onClick={show}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[180px]"
                >
                  Connect Wallet
                </button>
              )}
            </ConnectKitButton.Custom>
          )}
        </div>
      </main>

      {/* Execute Modal */}
      <ExecuteModal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        simulation={simulation}
        routeInfo={routeInfo}
        depositAmount={depositAmount}
        handleConfirmDeposit={handleConfirmDeposit}
        isDepositing={isDepositing}
        totalUSDC={totalUSDC}
        availableUSDC={availableUSDC}
      />

      {/* Bridge Modal */}
      <BridgeModal
        isOpen={showBridgeModal}
        onClose={() => setShowBridgeModal(false)}
        onSuccess={fetchUnifiedBalance}
        availableTokens={unifiedBalance}
      />
    </div>
  );
}
