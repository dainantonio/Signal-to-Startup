"use client";

import React, { useState, useEffect } from 'react';
import { Calculator, Users, Clock, TrendingUp } from 'lucide-react';

interface CostItem {
  category: string;
  baseAmount: number;
  description: string;
}

// FIX: Added deepDiveResult to the props to satisfy the TS compiler in page.tsx
interface CostEstimatorProps {
  initialItems?: CostItem[];
  deepDiveResult?: any; 
}

export function CostEstimator({ initialItems = [], deepDiveResult }: CostEstimatorProps) {
  // Interactive Multipliers
  const [teamSize, setTeamSize] = useState(2);
  const [timelineMonths, setTimelineMonths] = useState(3);
  const [marketingScale, setMarketingScale] = useState(1); // 1x to 5x
  
  const [totalCost, setTotalCost] = useState(0);

  // Default fallback data if the AI hasn't generated specific costs yet
  const defaultItems = [
    { category: "Software Development", baseAmount: 15000, description: "MVP app architecture and coding." },
    { category: "Legal & Compliance", baseAmount: 3000, description: "Entity formation and localized regulatory compliance." },
    { category: "Marketing & Go-to-Market", baseAmount: 5000, description: "Initial ad spend and launch campaign." }
  ];

  // Try to parse the costs out of deepDiveResult if it's passed in from the page
  let extractedItems: CostItem[] = [];
  if (deepDiveResult) {
    const rawCosts = deepDiveResult.costs || deepDiveResult.cost_estimates || [];
    if (Array.isArray(rawCosts)) {
      extractedItems = rawCosts.map((item: any) => ({
        category: item.category || item.name || 'Expense',
        // Parse the amount safely whether it's a number or a string like "$10,000"
        baseAmount: typeof item.amount === 'number' 
          ? item.amount 
          : parseInt(String(item.amount).replace(/[^0-9]/g, ''), 10) || 5000,
        description: item.description || ''
      }));
    }
  }

  // Decide which items to use (Prioritize extracted AI data > explicit initial items > defaults)
  const itemsToUse = extractedItems.length > 0 
    ? extractedItems 
    : (initialItems.length > 0 ? initialItems : defaultItems);

  // Recalculate total when sliders change
  useEffect(() => {
    let newTotal = 0;
    itemsToUse.forEach(item => {
      let calculatedAmount = item.baseAmount;
      
      // Apply logic based on category names
      const catLower = item.category.toLowerCase();
      if (catLower.includes("development") || catLower.includes("team") || catLower.includes("labor")) {
        calculatedAmount = (item.baseAmount / 2) * teamSize * (timelineMonths / 3);
      }
      if (catLower.includes("marketing") || catLower.includes("sales") || catLower.includes("ads")) {
        calculatedAmount = item.baseAmount * marketingScale;
      }
      
      newTotal += calculatedAmount;
    });
    setTotalCost(newTotal);
  }, [teamSize, timelineMonths, marketingScale, itemsToUse]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-800">Interactive Cost Estimator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls Section */}
        <div className="space-y-6 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2"><Users className="w-4 h-4"/> Team Size (Founders/Contractors)</span>
              <span className="font-bold text-blue-600">{teamSize}</span>
            </label>
            <input 
              type="range" min="1" max="10" value={teamSize} 
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2"><Clock className="w-4 h-4"/> Timeline to Launch (Months)</span>
              <span className="font-bold text-blue-600">{timelineMonths}</span>
            </label>
            <input 
              type="range" min="1" max="12" value={timelineMonths} 
              onChange={(e) => setTimelineMonths(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Marketing Aggression</span>
              <span className="font-bold text-blue-600">{marketingScale}x</span>
            </label>
            <input 
              type="range" min="1" max="5" step="0.5" value={marketingScale} 
              onChange={(e) => setMarketingScale(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex justify-between items-center">
            <span className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Estimated Total</span>
            <span className="text-3xl font-bold text-blue-600">
              ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="space-y-3 mt-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase">Cost Breakdown</h4>
            {itemsToUse.map((item, idx) => {
              // Calculate individual dynamic amounts for display
              let displayAmount = item.baseAmount;
              const catLower = item.category.toLowerCase();
              if (catLower.includes("development") || catLower.includes("team") || catLower.includes("labor")) {
                displayAmount = (item.baseAmount / 2) * teamSize * (timelineMonths / 3);
              }
              if (catLower.includes("marketing") || catLower.includes("sales") || catLower.includes("ads")) {
                displayAmount = item.baseAmount * marketingScale;
              }

              return (
                <div key={idx} className="flex justify-between items-center text-sm pb-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">{item.category}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <span className="font-semibold text-gray-700">
                    ${displayAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
