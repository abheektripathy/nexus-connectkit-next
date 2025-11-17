"use client";

import { useState, useCallback } from "react";
import { useNexus } from "@/providers/nexus";
import { toast } from "sonner";
import {
  BridgeResult,
  SimulationResult,
  TOKEN_METADATA,
} from "@avail-project/nexus-core";

interface BridgeParams {
  token: string;
  amount: string;
  toChainId: number;
}

export function useBridge() {
  const { nexusSDK, intentRefCallback, allowanceRefCallback } = useNexus();
  const [isBridging, setIsBridging] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  const simulateBridge = useCallback(
    async ({ token, amount, toChainId }: BridgeParams) => {
      if (!nexusSDK) {
        toast.error("SDK not initialized");
        return null;
      }

      if (!amount || parseFloat(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return null;
      }

      setIsSimulating(true);
      setCurrentStep("Simulating bridge...");

      try {
        const tokenMetadata =
          TOKEN_METADATA[token as keyof typeof TOKEN_METADATA];
        if (!tokenMetadata) {
          throw new Error(`Token ${token} not supported`);
        }

        const result = await nexusSDK.simulateBridge({
          token: token as keyof typeof TOKEN_METADATA,
          amount: amount,
          toChainId,
        });

        setSimulation(result);
        setCurrentStep("");
        return result;
      } catch (error) {
        console.error("Simulation error:", error);
        toast.error(
          error instanceof Error ? error.message : "Simulation failed",
        );
        setCurrentStep("");
        return null;
      } finally {
        setIsSimulating(false);
      }
    },
    [nexusSDK],
  );

  const executeBridge = useCallback(
    async ({ token, amount, toChainId }: BridgeParams) => {
      if (!nexusSDK) {
        return { success: false, error: "SDK not initialized" };
      }

      setIsBridging(true);
      setCurrentStep("Preparing transaction...");

      try {
        const tokenMetadata =
          TOKEN_METADATA[token as keyof typeof TOKEN_METADATA];
        if (!tokenMetadata) {
          throw new Error(`Token ${token} not supported`);
        }

        setCurrentStep("Initiating bridge...");
        const intentCheckInterval = setInterval(() => {
          if (intentRefCallback.current) {
            setCurrentStep("Approving intent...");
            intentRefCallback.current.allow();
            clearInterval(intentCheckInterval);
          }
        }, 100);

        const allowanceCheckInterval = setInterval(() => {
          if (allowanceRefCallback.current) {
            setCurrentStep("Approving allowance...");
            const sources = allowanceRefCallback.current.sources;
            const allowances = sources.map(() => "max");
            allowanceRefCallback.current.allow(allowances);
            clearInterval(allowanceCheckInterval);
          }
        }, 100);

        const result: BridgeResult = await nexusSDK.bridge({
          token: token as keyof typeof TOKEN_METADATA,
          amount: amount,
          toChainId,
        });

        clearInterval(intentCheckInterval);
        clearInterval(allowanceCheckInterval);
        setCurrentStep("");

        const explorerUrl = result.explorerUrl;
        if (explorerUrl) {
          toast.success(`Successfully bridged ${amount} ${token}!`, {
            duration: 5000,
            action: explorerUrl
              ? {
                  label: "View Transaction",
                  onClick: () => window.open(explorerUrl, "_blank"),
                }
              : undefined,
          });

          return { success: true, explorerUrl };
        } else {
          toast.error("Bridge transaction failed");
          return { success: false, error: "No transaction hash returned" };
        }
      } catch (error) {
        console.error("Bridge error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Bridge failed";
        toast.error(errorMessage);
        setCurrentStep("");
        return { success: false, error: errorMessage };
      } finally {
        setIsBridging(false);
      }
    },
    [nexusSDK, intentRefCallback, allowanceRefCallback],
  );

  return {
    isBridging,
    isSimulating,
    currentStep,
    simulation,
    simulateBridge,
    executeBridge,
  };
}
