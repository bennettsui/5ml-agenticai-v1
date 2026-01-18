'use client';

import ReceiptDashboard from '@/components/ReceiptDashboard';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

export default function MansAccountingDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Man's Accounting Firm
                </h1>
                <p className="text-sm text-gray-600">Receipt Processing Analytics</p>
              </div>
            </div>
            <Link
              href="/use-cases/mans-accounting"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Batch
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReceiptDashboard />
      </div>
    </div>
  );
}
