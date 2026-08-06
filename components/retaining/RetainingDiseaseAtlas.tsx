import React from 'react';
import { UnifiedDiseaseAtlas, UnifiedDiseaseAtlasProps } from '../common/UnifiedDiseaseAtlas';

export interface RetainingDiseaseAtlasProps {
  onInjectAndSimulate?: UnifiedDiseaseAtlasProps['onInjectAndSimulate'];
}

export const RetainingDiseaseAtlas: React.FC<RetainingDiseaseAtlasProps> = ({ onInjectAndSimulate }) => {
  return (
    <UnifiedDiseaseAtlas
      scenarioKey="retaining_structure"
      scenarioTitle="支挡结构倾覆与滑动失稳"
      categoryName="道路工程"
      subtitle="将墙后泄水孔堵塞与墙体前倾破损，动态转化为墙后附加静水压力 (ΔH_water) 与基底摩擦系数 (μ) 衰减。"
      onInjectAndSimulate={onInjectAndSimulate}
    />
  );
};

export default RetainingDiseaseAtlas;
