"use client";

import { useState } from "react";
import { useBridge } from "@/hooks/useBridge";

interface BridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  availableTokens: Array<{
    symbol: string;
    balance: string;
    decimals: number;
    icon?: string;
    breakdown?: Array<{
      balance: string;
      chain: {
        id: number;
        logo: string;
        name: string;
      };
    }>;
  }>;
}

export default function BridgeModal({
  isOpen,
  onClose,
  onSuccess,
  availableTokens,
}: BridgeModalProps) {
  const availableTokenSymbols = Array.from(
    new Set(availableTokens.map((t) => t.symbol)),
  );

  const availableChains = Array.from(
    new Map(
      availableTokens
        .flatMap((token) => token.breakdown || [])
        .map((b) => [
          b.chain.id,
          { id: b.chain.id, name: b.chain.name, logo: b.chain.logo },
        ]),
    ).values(),
  );

  const [selectedToken, setSelectedToken] = useState(
    availableTokenSymbols[0] || "USDC",
  );
  const [selectedChain, setSelectedChain] = useState(
    availableChains[0]?.id || 1,
  );
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    isBridging,
    isSimulating,
    currentStep,
    simulation,
    simulateBridge,
    executeBridge,
  } = useBridge();

  const selectedTokenData = availableTokens.find(
    (t) => t.symbol === selectedToken,
  );
  const totalBalance = selectedTokenData
    ? parseFloat(selectedTokenData.balance)
    : 0;

  const balanceBreakdown =
    selectedTokenData?.breakdown?.filter((b) => parseFloat(b.balance) > 0) ||
    [];

  const hasInsufficientBalance =
    amount && parseFloat(amount) > 0 && parseFloat(amount) > totalBalance;

  const handleAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSimulate = async () => {
    if (!selectedToken || !amount || parseFloat(amount) <= 0) {
      return;
    }

    const result = await simulateBridge({
      token: selectedToken,
      amount,
      toChainId: selectedChain,
    });

    if (result) {
      setShowConfirm(true);
    }
  };

  const handleConfirm = async () => {
    const result = await executeBridge({
      token: selectedToken,
      amount,
      toChainId: selectedChain,
    });

    if (result.success) {
      setShowConfirm(false);
      setAmount("");
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  const getRouteInfo = () => {
    if (!simulation) return null;
    const simData = simulation;
    const intent = simData.intent;
    if (!intent) return null;

    return {
      sources: intent.sources,
      destination: intent.destination,
      fees: intent.fees,
    };
  };

  const routeInfo = getRouteInfo();
  const bridgeFee = routeInfo?.fees ? routeInfo.fees.total || "0" : "0";
  const destinationChain = availableChains.find((c) => c.id === selectedChain);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {showConfirm && simulation ? (
        <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full p-6 space-y-4">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Confirm Bridge
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left side - Transaction details */}
            <div className="space-y-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  You want to receive
                </div>
                <div className="text-lg font-semibold text-black dark:text-white">
                  {parseFloat(amount).toFixed(4)} {selectedToken}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  on {destinationChain?.name}
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Bridge Fee
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {parseFloat(bridgeFee).toFixed(6)} {selectedToken}
                  </span>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-black dark:text-white">
                      Total from source
                    </span>
                    <span className="font-semibold text-black dark:text-white">
                      ~{(parseFloat(amount) + parseFloat(bridgeFee)).toFixed(4)}{" "}
                      {selectedToken}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                The SDK will automatically use your available balances from
                source chains.
              </div>
            </div>

            {/* Right side - Route visualization */}
            <div className="space-y-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
                  Bridge Route
                </div>

                {routeInfo && routeInfo.sources.length > 0 ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
                        From:
                      </div>
                      <div className="space-y-2">
                        {routeInfo.sources.map(
                          (source: Record<string, unknown>, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-black dark:text-white truncate">
                                  {source.chainName as string}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-500">
                                  {parseFloat(source.amount as string).toFixed(
                                    4,
                                  )}{" "}
                                  {selectedToken}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <svg
                        className="w-6 h-6 text-zinc-400 dark:text-zinc-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>

                    {routeInfo.destination && (
                      <div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
                          To:
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 rounded border-2 border-blue-500 dark:border-blue-600">
                          <div className="flex-1">
                            <div className="text-xs font-medium text-black dark:text-white">
                              {(routeInfo.destination?.chainName as string) ||
                                destinationChain?.name}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-500">
                              You receive: {amount} {selectedToken}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-sm font-medium text-black dark:text-white mb-1">
                      Direct Bridge
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                      To {destinationChain?.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isBridging}
              className="flex-1 h-10 rounded-full border border-zinc-300 dark:border-zinc-700 text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isBridging}
              className="flex-1 h-10 rounded-full bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50"
            >
              {isBridging ? currentStep || "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      ) : (
        // Input Form Modal
        <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-md w-full p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-black dark:text-white">
              Bridge Tokens
            </h3>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Token Selection */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Token to receive
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableTokenSymbols.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </div>

          {/* Available Balances */}
          {selectedTokenData && balanceBreakdown.length > 0 && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Your {selectedToken} Balances
              </div>
              <div className="space-y-2">
                {balanceBreakdown.map((breakdown, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={breakdown.chain.logo}
                        alt={breakdown.chain.name}
                        className="w-4 h-4 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%23ccc'/%3E%3C/svg%3E";
                        }}
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {breakdown.chain.name}
                      </span>
                    </div>
                    <span className="font-medium text-black dark:text-white">
                      {parseFloat(breakdown.balance).toFixed(4)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      Total Available
                    </span>
                    <span className="text-black dark:text-white">
                      {totalBalance.toFixed(4)} {selectedToken}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Amount to receive
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {hasInsufficientBalance && (
              <p className="text-xs text-red-500">
                Insufficient balance. You have {totalBalance.toFixed(4)}{" "}
                {selectedToken} total across all chains.
              </p>
            )}
          </div>

          {/* Destination Chain */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Destination Chain
            </label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(Number(e.target.value))}
              className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableChains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bridge Button */}
          <button
            onClick={handleSimulate}
            disabled={
              isSimulating ||
              !selectedToken ||
              !amount ||
              parseFloat(amount || "0") <= 0 ||
              Boolean(hasInsufficientBalance)
            }
            className="w-full h-12 rounded-full bg-foreground text-background font-medium transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSimulating ? (
              <>
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Simulating...
              </>
            ) : (
              `Bridge to ${destinationChain?.name}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
