"use client";

import { useEffect, useState, useCallback } from "react";
import { useNexus } from "@/providers/nexus";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";
import Image from "next/image";

interface UserAsset {
  symbol: string;
  balance: string;
  decimals: number;
  name?: string;
  chainId?: number;
}

export default function BalanceDashboard() {
  const [unifiedBalance, setUnifiedBalance] = useState<UserAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { nexusSDK } = useNexus();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

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

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    return num.toFixed(Math.min(6, decimals));
  };

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
                  {unifiedBalance.map((asset, index) => (
                    <div
                      key={`${asset.symbol}-${asset.chainId || index}-${index}`}
                      className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center text-center min-h-[120px]"
                    >
                      <h3 className="font-semibold text-lg text-black dark:text-zinc-50 mb-1">
                        {asset.symbol}
                      </h3>
                      <p className="font-mono text-sm text-black dark:text-zinc-50 mb-2">
                        {formatBalance(asset.balance, asset.decimals)}
                      </p>
                      {asset.name && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-full">
                          {asset.name}
                        </p>
                      )}
                      {asset.chainId && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                          Chain: {asset.chainId}
                        </p>
                      )}
                    </div>
                  ))}
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
              <button
                onClick={fetchUnifiedBalance}
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={fetchUnifiedBalance}
                disabled={isLoading}
                className="flex h-12 w-64! items-center justify-center gap-2 rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deposit 1$ to AAVE
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
    </div>
  );
}
