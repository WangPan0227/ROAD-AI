import React from 'react';
import { UnifiedDiseaseAtlas, UnifiedDiseaseAtlasProps } from './common/UnifiedDiseaseAtlas';

export interface SlopeDiseaseAtlasProps {
  onInjectAndSimulate?: UnifiedDiseaseAtlasProps['onInjectAndSimulate'];
}

export const SlopeDiseaseAtlas: React.FC<SlopeDiseaseAtlasProps> = ({ onInjectAndSimulate }) => {
  return (
    <UnifiedDiseaseAtlas
      scenarioKey="slope_instability"
      scenarioTitle="边坡变形与滑坡失稳"
      categoryName="道路工程"
      subtitle="将坡顶张裂缝与坡脚蠕滑量化，动态折减土体粘聚力 (c) 与内摩擦角 (φ)，并引入裂缝充水静水压力边界。"
      onInjectAndSimulate={onInjectAndSimulate}
    />
  );
};

export default SlopeDiseaseAtlas;
