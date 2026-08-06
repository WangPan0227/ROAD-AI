import React, { useState } from 'react';
import { UnifiedDiseaseAtlas, UnifiedDiseaseAtlasProps } from '../common/UnifiedDiseaseAtlas';
import { normalizeScenarioKey } from '../../data/diseaseMatrixData';

export interface BridgeDiseaseAtlasProps {
  activeScenario?: string;
  onInjectAndSimulate?: UnifiedDiseaseAtlasProps['onInjectAndSimulate'];
}

const BRIDGE_SCENARIOS = [
  { key: 'pier_impact', name: '桥墩碰撞偏位' },
  { key: 'girder_unseating', name: '梁体位移落梁' },
  { key: 'component_damage', name: '构件泥石流冲击' },
];

export const BridgeDiseaseAtlas: React.FC<BridgeDiseaseAtlasProps> = ({
  activeScenario = 'pier_impact',
  onInjectAndSimulate
}) => {
  const [userSelectedKey, setUserSelectedKey] = useState<string | null>(null);
  const currentKey = userSelectedKey ? normalizeScenarioKey(userSelectedKey) : normalizeScenarioKey(activeScenario);

  const getTitleAndSubtitle = (key: string) => {
    switch (key) {
      case 'girder_unseating':
        return {
          title: '梁体垮塌与支座位移落梁',
          subtitle: '将地震及大位移下支座老化偏位与挡块损伤，量化映射为有效支撑残余长度衰减与设防烈度提档。'
        };
      case 'component_damage':
      case 'component_corrosion':
        return {
          title: '桥梁构件泥石流与块石冲击',
          subtitle: '将泥石流等极值流体与巨石冲击表观开裂，量化映射为泥石流流体密度 (ρ_df) 与龙头流速 (v_df)。'
        };
      case 'pier_impact':
      default:
        return {
          title: '桥墩偏位与船撞/车撞损伤',
          subtitle: '将塑性铰区开裂与混凝土剥落破损，量化映射为墩柱延性系数 (μ_d) 与保护层厚度损失。'
        };
    }
  };

  const { title, subtitle } = getTitleAndSubtitle(currentKey);

  return (
    <UnifiedDiseaseAtlas
      scenarioKey={currentKey}
      scenarioTitle={title}
      categoryName="桥梁工程"
      subtitle={subtitle}
      availableScenarios={BRIDGE_SCENARIOS}
      onSelectScenario={(key) => setUserSelectedKey(key)}
      onInjectAndSimulate={onInjectAndSimulate}
    />
  );
};

export default BridgeDiseaseAtlas;
