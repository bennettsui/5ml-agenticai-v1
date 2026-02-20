'use client';

import { Suspense } from 'react';
import { ChartCalculator } from '@/app/use-cases/ziwei/chart-calculator';
import { Loader } from 'lucide-react';

export default function ZiweiChartCalculatorWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    }>
      <ChartCalculator />
    </Suspense>
  );
}
