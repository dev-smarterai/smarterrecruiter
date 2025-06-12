'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RiArrowLeftLine } from '@remixicon/react';
import styles from './styles.module.css';
import './funnel.css'; // We'll create this file next
// AI Navigation imports
import { AIPageWrapper } from "@/lib/ai-navigation"
import { AIContentBlock } from "@/components/ui/ai-navigation/AIContentBuilder"

export default function PipelinePage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    const initFunnel = async () => {
      if (typeof window !== 'undefined') {
        // Dynamically import the library only on client side
        const FunnelGraph = (await import('funnel-graph-js')).default;
        
        const data = {
          labels: [
            "Applied",
            "Screened",
            "Interviewed",
            "Assessed",
               "Offers",
          ],
          subLabels: ["Low", "Medium", "High", "Critical"],
          colors: [
            ["#e6e6fa"], // Light purple for Applied
            ["#c5c5f1"], // Screened
            ["#a4a4e8"], // Interviewed
            ["#8383df"], // Assessed
            ["#6262d6"]  // Offers (dark purple)
          ],
          values: [
            [22, 22, 22, 22],
            [280, 280, 280, 280],
            [280, 280, 280, 280],
            [620, 620, 620, 620],
            [1000, 1000, 1000, 1000],
          ],
        };

        // Initialize the funnel graph
        const graph = new FunnelGraph({
          container: ".Funnel",
          gradientDirection: "vertical",
          data: data,
          displayPercent: true,
          direction: "horizontal",
          width: 1000,
          height: 300,
          subLabelValue: "raw",
          inverted: false 
        });

        graph.draw();
      }
    };

    if (isClient) {
      initFunnel();
    }

    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        const funnelElement = document.querySelector('.Funnel');
        if (funnelElement) {
          funnelElement.innerHTML = '';
        }
      }
    };
  }, [isClient]);

  return (
    <AIPageWrapper>
      <AIContentBlock delay={0} blockType="header">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm hover:shadow-md transition-all"
          >
            <RiArrowLeftLine className="h-5 w-5 text-purple-600" />
          </Link>
        </div>
      </AIContentBlock>
      
      <AIContentBlock delay={0.5} blockType="header">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Candidate Pipeline Overview</h1>
          <p className="text-base text-gray-600">Visualizing conversion, diversity, and efficiency across hiring stages.</p>
        </div>
      </AIContentBlock>
      
      <AIContentBlock delay={1} blockType="card">
        <div className={styles.App}>
          <div className="Funnel" />
        </div>
      </AIContentBlock>

      <AIContentBlock delay={1.5} blockType="header">
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            280 interviews have been carried out in the last week
          </h2>
        </div>
      </AIContentBlock>
    </AIPageWrapper>
  );
} 