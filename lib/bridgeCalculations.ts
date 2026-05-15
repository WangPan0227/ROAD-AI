export interface BridgeEngineParams {
  D: number;         // 桥墩直径 (m)
  Ae: number;        // 墩柱塑性铰区域截面全面积 (cm²)
  Ag: number;        // 核心混凝土面积 (cm²)
  Ast: number;       // 螺旋箍筋面积 (cm²)
  Nmin: number;      // 墩柱截面最小轴力 (kN)
  fc: number;        // 混凝土抗压强度设计值 (MPa)
  fyt: number;       // 箍筋抗拉强度设计值 (MPa)
  miu_d: number;     // 桥墩构件位移延性系数
  s: number;         // 箍筋间距 (cm)
  D_prime: number;   // 螺旋箍筋环直径 (cm)
  Ek: number;        // 输入冲击动能 (kJ)
}

export interface BridgeEcoConfig {
  cost_cfrp?: [number, number];   // 碳纤维包裹: [单价(元/m²), 工效]
  cost_jacket?: [number, number]; // 外包钢管混凝土: [单价(元/m), 工效]
  cost_fender?: [number, number]; // 柔性防撞套箱: [单价(元/套), 工效]
}

/**
 * 1. 核心计算模块：计算单柱抗剪承载力 Vn
 */
export const calculate_vn = (p: BridgeEngineParams & { damage_factor?: number }) => {
  let rho_st = (4 * p.Ast) / (p.s * p.D_prime);
  if (rho_st > 2.4 / p.fyt) rho_st = 2.4 / p.fyt;

  let lamda = (rho_st * p.fyt) / 10 + 0.38 - 0.1 * p.miu_d;
  lamda = Math.max(0.03, Math.min(0.3, lamda));

  let vc = lamda * (1 + p.Nmin / (1.38 * p.Ag)) * Math.sqrt(p.fc);
  vc = Math.max(vc, 0.355 * Math.sqrt(p.fc), 1.47 * lamda * Math.sqrt(p.fc));

  const Vc = 0.1 * vc * p.Ae;
  const Vs = 0.1 * (Math.PI / 2) * p.Ast * p.fyt * p.D_prime / p.s;

  const totalVn = Vc + Vs;
  return { 
    Vn: p.damage_factor ? totalVn * p.damage_factor : totalVn, 
    Vc, 
    Vs 
  };
};

/**
 * 2. 状态评估模块：双折线能量-位移插值 (计算损伤度 αD)
 */
export const calculate_bridge_impact = (params: BridgeEngineParams & { damage_factor?: number }) => {
  const { D, Ek } = params;
  const { Vn, Vc, Vs } = calculate_vn(params);

  const c1 = 1.94, c2 = 2.34;
  const Fs1 = c1 * Vn;
  const Fs2 = c2 * Vn;
  const delta_s1 = 0.02 * D;
  const delta_s2 = 0.1 * D;

  const C1 = 3.93, C2 = 1.81;
  const Ek1 = C1 * Fs1 * delta_s1;
  const Ek2 = C2 * Fs2 * delta_s2;

  let Fs: number, delta_s: number;

  if (Ek < Ek1) {
    Fs = (Fs1 / Ek1) * Ek;
    delta_s = (Fs / Fs1) * delta_s1;
  } else if (Ek < Ek2) {
    Fs = Fs1 + ((Fs2 - Fs1) / (Ek2 - Ek1)) * (Ek - Ek1);
    delta_s = ((Fs - Fs1) * (delta_s2 - delta_s1)) / (Fs2 - Fs1) + delta_s1;
  } else {
    Fs = Fs2;
    delta_s = delta_s2;
  }

  return {
    Fs,
    delta_s_cm: delta_s * 100, 
    alpha_D: delta_s / D,
    Vn, Vc, Vs
  };
};

/**
 * 3. 智能决策模块：桥梁加固正交推演 (力学补偿与耗能削减)
 */
export const optimize_bridge_reinforcement = (
  baseParams: BridgeEngineParams, 
  ecoConfig: BridgeEcoConfig
) => {
  const [price_cfrp, eff_cfrp] = ecoConfig.cost_cfrp || [800, 50];    
  const [price_jacket, eff_jacket] = ecoConfig.cost_jacket || [15000, 2]; 
  const [price_fender, eff_fender] = ecoConfig.cost_fender || [450000, 0.5]; 

  const schemes = [];

  // 方案 1：碳纤维 (CFRP) 环向包裹
  const params_1 = { ...baseParams, Ast: baseParams.Ast * 3.0, miu_d: Math.max(baseParams.miu_d, 8.0) };
  const res_1 = calculate_bridge_impact(params_1);
  const area_cfrp = Math.PI * baseParams.D * 5.0 * 2; 
  schemes.push({
      id: 'S1', name: '方案一：碳纤维 (CFRP) 环向包裹',
      measures: ['CFRP抗剪增强'],
      cost: area_cfrp * price_cfrp, time: area_cfrp / eff_cfrp,
      finalAlphaD: res_1.alpha_D, finalDisp: res_1.delta_s_cm,
      desc: '通过环向强约束提升抗剪上限与结构延性，施工快捷，不改变桥下通航净空。'
  });

  // 方案 2：外包钢管混凝土套裙 (增大截面法)
  const params_2 = { 
      ...baseParams, D: baseParams.D + 0.4, Ae: baseParams.Ae * 1.5, Ag: baseParams.Ag * 1.5, fc: baseParams.fc * 1.2 
  };
  const res_2 = calculate_bridge_impact(params_2);
  const length_jacket = 8.0 * 2; 
  schemes.push({
      id: 'S2', name: '方案二：外包钢管混凝土套裙',
      measures: ['增大截面', '钢管约束'],
      cost: length_jacket * price_jacket, time: length_jacket / eff_jacket,
      finalAlphaD: res_2.alpha_D, finalDisp: res_2.delta_s_cm,
      desc: '提供绝对的刚度与抗力双重保障，适用于存在严重重载撞击风险的航道墩柱。'
  });

  // 方案 3：增设柔性防撞套箱 (隔离耗能法)
  const params_3 = { ...baseParams, Ek: baseParams.Ek * 0.4 };
  const res_3 = calculate_bridge_impact(params_3);
  schemes.push({
      id: 'S3', name: '方案三：复合材料柔性防撞套箱',
      measures: ['耗能缓冲', '撞击隔离'],
      cost: 2 * price_fender, time: 2 / eff_fender, 
      finalAlphaD: res_3.alpha_D, finalDisp: res_3.delta_s_cm,
      desc: '“以柔克刚”，在撞击发生瞬间吸收并耗散极大的动能，治标治本。'
  });

  const validSchemes = schemes.filter(s => s.finalAlphaD < 0.02);
  return validSchemes.length > 0 
      ? validSchemes.sort((a, b) => a.cost - b.cost) 
      : schemes.sort((a, b) => a.finalAlphaD - b.finalAlphaD);
};

/**
 * 4. 梁体落梁/垮塌仿真 (Girder Unseating Simulation)
 */
export const calculate_girder_unseating = (params: { 
  span: number,       // 跨径 (m)
  overlap: number,    // 支承长度 (cm)
  displacement: number // 实测偏移/位移 (cm)
}) => {
  // 规范建议最小支承长度 N_req = (70 + 0.5 * L) * 0.1 (单位换算为 cm 还是 m？通常规范为 mm, 这里假设 overlap 输入为 cm)
  const N_req = 70 + 0.5 * params.span; // 单位 cm
  const remaining = params.overlap - params.displacement;
  const risk_ratio = params.displacement / params.overlap;
  const is_unseated = remaining <= 0;
  
  return {
    N_req,
    remaining,
    risk_ratio,
    status: is_unseated ? 'collapsed' : (remaining < 20 ? 'warning' : 'safe')
  };
};

/**
 * 5. 构件损伤评估 (Component Damage Assessment)
 */
export const calculate_bridge_component_damage = (params: {
  baseVn: number,     // 设计承载力 (kN)
  reinforcement_depth: number, // 露筋深度 (mm)
  corrosion_area_ratio: number // 锈蚀面积比 (0-1)
}) => {
  // 简化折减模型
  const factor_depth = Math.max(0.5, 1 - params.reinforcement_depth / 50); 
  const factor_corrosion = Math.max(0.4, 1 - params.corrosion_area_ratio * 0.8);
  const damage_factor = factor_depth * factor_corrosion;
  
  return {
    currentVn: params.baseVn * damage_factor,
    damage_factor,
    reduction_percentage: (1 - damage_factor) * 100
  };
};
