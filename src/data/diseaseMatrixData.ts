export interface DiseaseLevelSchema {
  level: 1 | 2 | 3 | 4;
  levelName: string;      // 如 "Ⅰ级病害：轻微/设计态"
  color: 'emerald' | 'amber' | 'orange' | 'rose';
  description: string;    // 表观特征描述
  physicalEffects: string;// 物理机制影响
  injectedParameters: Record<string, number | boolean>; // 动态注入仿真引擎的物理参数
}

export const SCENARIO_KEY_ALIAS: Record<string, string> = {
  'component_corrosion': 'component_damage',
  'rock_pressure': 'lining_failure',
  'crown_collapse': 'rock_collapse_plugging',
};

export const normalizeScenarioKey = (key: string): string => {
  return SCENARIO_KEY_ALIAS[key] || key;
};

export const SCENARIO_DISEASE_MATRIX: Record<string, DiseaseLevelSchema[]> = {
  // 1.1 路基沉降
  'subgrade_settlement': [
    { level: 1, levelName: 'Ⅰ级病害：结构完好', color: 'emerald', description: '路面平整，工后沉降小于10mm。', physicalEffects: '保持设计模量与压实度。', injectedParameters: { compaction_loss: 0.0, cbr_multiplier: 1.0 } },
    { level: 2, levelName: 'Ⅱ级病害：轻微沉降', color: 'amber', description: '路面出现轻微纵向开裂，沉降10~50mm。', physicalEffects: '压实度出现 5% 损耗。', injectedParameters: { compaction_loss: 0.05, cbr_multiplier: 0.9 } },
    { level: 3, levelName: 'Ⅲ级病害：严重沉降', color: 'orange', description: '出现明显网裂与错台，沉降50~150mm。', physicalEffects: '雨水入渗导致模量折减 30%。', injectedParameters: { compaction_loss: 0.15, cbr_multiplier: 0.7 } },
    { level: 4, levelName: 'Ⅳ级病害：沉陷失稳', color: 'rose', description: '路基翻浆冒泥，工后沉降超过150mm。', physicalEffects: '基层承载力丧失。', injectedParameters: { compaction_loss: 0.30, cbr_multiplier: 0.4 } }
  ],
  // 1.2 边坡失稳
  'slope_instability': [
    { level: 1, levelName: 'Ⅰ级病害：坡面微裂', color: 'emerald', description: '坡面局部细小裂纹，无整体变形。', physicalEffects: '保持原始抗剪强度。', injectedParameters: { c_factor: 1.0, phi_factor: 1.0, crack_depth: 0 } },
    { level: 2, levelName: 'Ⅱ级病害：张裂缝萌生', color: 'amber', description: '坡顶弧形张裂缝，宽度1~5cm。', physicalEffects: '粘聚力折减 15%，引入 1.5m 张裂缝。', injectedParameters: { c_factor: 0.85, phi_factor: 0.95, crack_depth: 1.5 } },
    { level: 3, levelName: 'Ⅲ级病害：蠕变蠕滑', color: 'orange', description: '坡脚错台鼓胀，裂缝深度扩展。', physicalEffects: '抗剪强度大幅折减，裂缝积水。', injectedParameters: { c_factor: 0.65, phi_factor: 0.85, crack_depth: 3.0 } },
    { level: 4, levelName: 'Ⅳ级病害：失稳滑动', color: 'rose', description: '贯穿滑动面形成，安全系数 Fs < 1.0。', physicalEffects: '残余抗剪强度控制。', injectedParameters: { c_factor: 0.40, phi_factor: 0.70, crack_depth: 5.0 } }
  ],
  // 1.3 支挡结构
  'retaining_structure': [
    { level: 1, levelName: 'Ⅰ级病害：结构稳定', color: 'emerald', description: '墙体无开裂，排水孔畅通。', physicalEffects: '无附加水压。', injectedParameters: { delta_water: 0, mu_factor: 1.0 } },
    { level: 2, levelName: 'Ⅱ级病害：排水堵塞', color: 'amber', description: '墙后积水抬升，墙顶出现开裂。', physicalEffects: '附加 2m 静水压力。', injectedParameters: { delta_water: 2.0, mu_factor: 0.95 } },
    { level: 3, levelName: 'Ⅲ级病害：墙体前倾', color: 'orange', description: '墙身向外倾斜，基底滑移迹象。', physicalEffects: '积水达墙高一半，基底摩擦下降。', injectedParameters: { delta_water: 3.5, mu_factor: 0.80 } },
    { level: 4, levelName: 'Ⅳ级病害：倾覆失稳', color: 'rose', description: '墙身严重破损，抗滑/抗倾覆系数超限。', physicalEffects: '满水推力且基底失稳。', injectedParameters: { delta_water: 5.0, mu_factor: 0.60 } }
  ],
  // 2.1 桥墩碰撞
  'pier_impact': [
    { level: 1, levelName: 'Ⅰ级病害：表面擦伤', color: 'emerald', description: '混凝土保护层轻微刮痕。', physicalEffects: '截面与延性无衰减。', injectedParameters: { miu_d: 6, cc_loss: 0 } },
    { level: 2, levelName: 'Ⅱ级病害：保护层开裂', color: 'amber', description: '塑性铰区出现网状裂缝。', physicalEffects: '变形延性增加，位移增加。', injectedParameters: { miu_d: 8, cc_loss: 1.0 } },
    { level: 3, levelName: 'Ⅲ级病害：混凝土剥落', color: 'orange', description: '保护层大量剥落，箍筋外露。', physicalEffects: '保护层厚度丧失，抗剪强度下降。', injectedParameters: { miu_d: 10, cc_loss: 2.0 } },
    { level: 4, levelName: 'Ⅳ级病害：核心区压碎', color: 'rose', description: '箍筋压屈，墩柱剪切压碎失稳。', physicalEffects: '核心混凝土损伤，抗剪承载力剧降。', injectedParameters: { miu_d: 12, cc_loss: 2.0 } }
  ],
  // 2.2 梁体落梁
  'girder_unseating': [
    { level: 1, levelName: 'Ⅰ级病害：支座正常', color: 'emerald', description: '支座偏移在弹性容许范围内。', physicalEffects: '按基准 E2 地震力求解。', injectedParameters: { intensity_boost: 0, support_loss: 0 } },
    { level: 2, levelName: 'Ⅱ级病害：支座剪切变形', color: 'amber', description: '支座出现老化与大剪切偏位。', physicalEffects: '有效支撑长度减少 50mm。', injectedParameters: { intensity_boost: 0, support_loss: 50 } },
    { level: 3, levelName: 'Ⅲ级病害：挡块破损', color: 'orange', description: '防落梁挡块开裂，限制能力下降。', physicalEffects: '罕遇地震下相对位移加大。', injectedParameters: { intensity_boost: 1, support_loss: 100 } },
    { level: 4, levelName: 'Ⅳ级病害：落梁失稳', color: 'rose', description: '搭接长度不足，梁体位移超限脱落。', physicalEffects: '安全系数 SF < 1.0。', injectedParameters: { intensity_boost: 2, support_loss: 200 } }
  ],
  // 2.3 构件损伤
  'component_damage': [
    { level: 1, levelName: 'Ⅰ级病害：清水冲刷', color: 'emerald', description: '低密度流体冲击，表层无损。', physicalEffects: '低泥石流密度与流速。', injectedParameters: { rho_df: 1500, v_df: 2.0 } },
    { level: 2, levelName: 'Ⅱ级病害：表层剥蚀', color: 'amber', description: '泥石流挟带泥沙磨蚀墩身。', physicalEffects: '密度与冲击力上升。', injectedParameters: { rho_df: 1800, v_df: 4.0 } },
    { level: 3, levelName: 'Ⅲ级病害：块石撞击开裂', color: 'orange', description: '巨石冲击导致塑性铰区屈服开裂。', physicalEffects: '高密度高流速冲击。', injectedParameters: { rho_df: 2100, v_df: 6.0 } },
    { level: 4, levelName: 'Ⅳ级病害：剪切破坏', color: 'rose', description: '等效冲击力大于截面抗剪承载力 Vn。', physicalEffects: '极值泥石流冲击爆发。', injectedParameters: { rho_df: 2300, v_df: 8.0 } }
  ],
  // 3.1 衬砌破坏
  'lining_failure': [
    { level: 1, levelName: 'Ⅰ级病害：微开裂期', color: 'emerald', description: '裂缝宽度 < 0.1mm，结构弹性。', physicalEffects: '基准弯矩轴力。', injectedParameters: { M_boost: 1.0, N_factor: 1.0 } },
    { level: 2, levelName: 'Ⅱ级病害：开裂发展期', color: 'amber', description: '裂缝宽度 0.1~0.2mm，局部拉应力集中。', physicalEffects: '弯矩增加 30%。', injectedParameters: { M_boost: 1.3, N_factor: 0.9 } },
    { level: 3, levelName: 'Ⅲ级病害：贯穿开裂期', color: 'orange', description: '裂缝宽度 0.2~0.4mm，渗漏水严重。', physicalEffects: '弯矩增加 70%，偏心距增大。', injectedParameters: { M_boost: 1.7, N_factor: 0.7 } },
    { level: 4, levelName: 'Ⅳ级病害：衬砌破坏期', color: 'rose', description: '裂缝宽度 > 0.4mm，压碎掉块失稳。', physicalEffects: '截面承载力极限破坏。', injectedParameters: { M_boost: 2.2, N_factor: 0.5 } }
  ],
  // 3.2 坍塌封堵
  'rock_collapse_plugging': [
    { level: 1, levelName: 'Ⅰ级病害：围岩稳定', color: 'emerald', description: '无塑性变形，围岩处于弹性状态。', physicalEffects: '等效塑性应变为零。', injectedParameters: { strain_max: -0.0005, sigma_y_factor: 1.0 } },
    { level: 2, levelName: 'Ⅱ级病害：局部屈服', color: 'amber', description: '开挖面周围出现微小塑性区。', physicalEffects: '变形增加，屈服点萌生。', injectedParameters: { strain_max: -0.0010, sigma_y_factor: 0.9 } },
    { level: 3, levelName: 'Ⅲ级病害：剪切松动带', color: 'orange', description: '塑性区扩展贯通，拱顶小范围掉块。', physicalEffects: '塑性应变显著累积。', injectedParameters: { strain_max: -0.0020, sigma_y_factor: 0.7 } },
    { level: 4, levelName: 'Ⅳ级病害：拱顶大坍塌', color: 'rose', description: '围岩失稳大面积塌方，需大量封堵注浆。', physicalEffects: '塑性爆发与塌方体形成。', injectedParameters: { strain_max: -0.0035, sigma_y_factor: 0.5 } }
  ],
  // 3.3 壁后脱空
  'lining_void': [
    { level: 1, levelName: 'Ⅰ级病害：背部密实', color: 'emerald', description: '衬砌与围岩紧密贴合，无空洞。', physicalEffects: '围岩抗力均布。', injectedParameters: { void_width: 0, void_factor: 1.0 } },
    { level: 2, levelName: 'Ⅱ级病害：局部小脱空', color: 'amber', description: '拱腰或拱顶脱空角度 < 15°。', physicalEffects: '脱空区压力轻微折减。', injectedParameters: { void_width: 15, void_factor: 0.3 } },
    { level: 3, levelName: 'Ⅲ级病害：显著脱空', color: 'orange', description: '脱空角度 15°~30°，深度 > 10cm。', physicalEffects: '脱空区压力完全丧失，弯矩重分布。', injectedParameters: { void_width: 30, void_factor: 0.0 } },
    { level: 4, levelName: 'Ⅳ级病害：严重脱空破裂', color: 'rose', description: '脱空角度 > 45°，引发强烈弯矩突变与开裂。', physicalEffects: '严重应力集中与二次破坏。', injectedParameters: { void_width: 50, void_factor: 0.0 } }
  ]
};

// Helper function to fetch disease levels for a scenario from localStorage or default
export function getScenarioDiseaseLevels(rawKey: string): DiseaseLevelSchema[] {
  const key = normalizeScenarioKey(rawKey);
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`disease_matrix_${key}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(`Failed to parse saved disease matrix for ${key}:`, e);
      }
    }
  }
  return SCENARIO_DISEASE_MATRIX[key] || SCENARIO_DISEASE_MATRIX['subgrade_settlement'];
}

// Helper function to save custom disease levels for a scenario
export function saveScenarioDiseaseLevels(rawKey: string, levels: DiseaseLevelSchema[]): void {
  const key = normalizeScenarioKey(rawKey);
  if (typeof window !== 'undefined') {
    localStorage.setItem(`disease_matrix_${key}`, JSON.stringify(levels));
  }
}

// Helper function to reset disease levels to default
export function resetScenarioDiseaseLevels(rawKey: string): DiseaseLevelSchema[] {
  const key = normalizeScenarioKey(rawKey);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`disease_matrix_${key}`);
  }
  return SCENARIO_DISEASE_MATRIX[key] || SCENARIO_DISEASE_MATRIX['subgrade_settlement'];
}
