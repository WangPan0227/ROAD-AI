import React from 'react';
import { UnifiedDiseaseAtlas, UnifiedDiseaseAtlasProps } from '../common/UnifiedDiseaseAtlas';

export interface RoadbedDiseaseAtlasProps {
  onInjectAndSimulate?: UnifiedDiseaseAtlasProps['onInjectAndSimulate'];
}

export const RoadbedDiseaseAtlas: React.FC<RoadbedDiseaseAtlasProps> = ({ onInjectAndSimulate }) => {
  return (
    <UnifiedDiseaseAtlas
      scenarioKey="subgrade_settlement"
      scenarioTitle="路基沉降与水毁垮塌"
      categoryName="道路工程"
      subtitle="将路面表观开裂与沉降特征，量化映射为底层水力学及沉降计算引擎的压实度损耗与CBR承载力衰减因子。"
      onInjectAndSimulate={onInjectAndSimulate}
    />
  );
};

export default RoadbedDiseaseAtlas;
