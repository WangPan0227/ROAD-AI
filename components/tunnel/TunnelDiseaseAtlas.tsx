import React, { useState } from 'react';
import { UnifiedDiseaseAtlas, UnifiedDiseaseAtlasProps } from '../common/UnifiedDiseaseAtlas';
import { normalizeScenarioKey } from '../../data/diseaseMatrixData';

export interface TunnelDiseaseAtlasProps {
  activeScenario?: string;
  onInjectAndSimulate?: UnifiedDiseaseAtlasProps['onInjectAndSimulate'];
}

const TUNNEL_SCENARIOS = [
  { key: 'lining_failure', name: '衬砌结构破坏' },
  { key: 'rock_collapse_plugging', name: '围岩坍塌封堵' },
  { key: 'lining_void', name: '壁后空洞脱空' },
];

export const TunnelDiseaseAtlas: React.FC<TunnelDiseaseAtlasProps> = ({
  activeScenario = 'lining_failure',
  onInjectAndSimulate
}) => {
  const [userSelectedKey, setUserSelectedKey] = useState<string | null>(null);
  const currentKey = userSelectedKey ? normalizeScenarioKey(userSelectedKey) : normalizeScenarioKey(activeScenario);

  const getTitleAndSubtitle = (key: string) => {
    switch (key) {
      case 'rock_collapse_plugging':
      case 'crown_collapse':
        return {
          title: '拱顶坍塌与围岩塑性区封堵',
          subtitle: '将开挖面围岩掉块与大塌方表观特征，量化映射为围岩等效塑性应变 (ε_p) 阈值与屈服强度折减。'
        };
      case 'lining_void':
        return {
          title: '衬砌壁后脱空与局域应力集中',
          subtitle: '将衬砌背部密实度丧失与不均匀脱空，量化映射为脱空张角 (θ_void) 与脱空区围岩反力系数。'
        };
      case 'lining_failure':
      case 'rock_pressure':
      default:
        return {
          title: '衬砌开裂与结构承载力破坏',
          subtitle: '将衬砌裂缝宽度扩展 (MC2010)，量化映射为偏心受力弯矩放大倍数 (M_boost) 与有效轴力因子。'
        };
    }
  };

  const { title, subtitle } = getTitleAndSubtitle(currentKey);

  return (
    <UnifiedDiseaseAtlas
      scenarioKey={currentKey}
      scenarioTitle={title}
      categoryName="隧道工程"
      subtitle={subtitle}
      availableScenarios={TUNNEL_SCENARIOS}
      onSelectScenario={(key) => setUserSelectedKey(key)}
      onInjectAndSimulate={onInjectAndSimulate}
    />
  );
};

export default TunnelDiseaseAtlas;
