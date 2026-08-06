import { DamageParameters, ReinforcementParameters } from '../types/schema';

export interface BridgeImpactParams {
  D: number;        // 墩柱直径 (m)
  Dst: number;      // 螺旋箍筋直径 (mm)
  Nmin: number;     // 墩柱截面最小轴力 (kN)
  fc: number;       // 混凝土抗压强度设计值 (MPa)
  fyt: number;      // 箍筋抗拉强度设计值 (MPa)
  miu_d: number;    // 桥墩构件位移延性系数
  s: number;        // 箍筋间距 (cm)
  cc: number;       // 保护层厚度 (cm)
}

/**
 * 桥梁落石/水平冲击塑性铰抗剪承载力与变形仿真引擎
 * 参考《Dynamic behaviors and equivalent static force of double-column pier under horizontal impact》
 */
export const calculate_rockfall_impact_vn = (params: BridgeImpactParams) => {
  const { D, Dst, Nmin, fc, fyt, miu_d, s, cc } = params;

  // 1. 几何与配筋推导
  const Ae = (Math.PI / 4) * Math.pow(D, 2) * 100;    // 墩柱全面积 (cm²)
  const Ag = 0.8 * Ae;                               // 核心混凝土面积 (cm²)
  const Ast = (Math.PI / 4) * Math.pow(Dst, 2) / 100; // 螺旋箍筋面积 (cm²)
  const D_prime = 100 * D - 2 * cc;                  // 螺旋箍筋环直径 (cm)

  // 2. 体积配筋率与延性系数校验
  let rho_st = (4 * Ast) / Math.max(0.001, s * D_prime);
  if (rho_st > 2.4 / fyt) {
    rho_st = 2.4 / fyt;
  }

  let lamda = (rho_st * fyt) / 10 + 0.38 - 0.1 * miu_d;
  if (lamda < 0.03) lamda = 0.03;
  if (lamda > 0.3) lamda = 0.3;

  // 3. 塑性铰区混凝土抗剪强度 vc 求解
  let vc = lamda * (1 + Nmin / (1.38 * Ag)) * Math.sqrt(fc);
  if (vc < 0.355 * Math.sqrt(fc)) {
    vc = 0.355 * Math.sqrt(fc);
    if (vc < 1.47 * lamda * Math.sqrt(fc)) {
      vc = 1.47 * lamda * Math.sqrt(fc);
    }
  }

  const Vc = vc * Ae; // 抗剪承载力 Vc (kN)

  return {
    Ae,
    Ag,
    Ast,
    D_prime,
    rho_st,
    lamda,
    vc,
    Vc,
    status: Vc > 800 ? 'safe' : (Vc > 400 ? 'warning' : 'critical')
  };
};

export interface BridgeEngineParams {
  D: number;         // 桥墩直径 (m)
  Dst?: number;      // 螺旋箍筋直径 (mm)
  cc?: number;       // 保护层厚度 (cm)
  Ae?: number;       // 墩柱塑性铰区域截面全面积 (cm²)
  Ag?: number;       // 核心混凝土面积 (cm²)
  Ast?: number;      // 螺旋箍筋面积 (cm²)
  Nmin: number;      // 墩柱截面最小轴力 (kN)
  fc: number;        // 混凝土抗压强度设计值 (MPa)
  fyt: number;       // 箍筋抗拉强度设计值 (MPa)
  miu_d: number;     // 桥墩构件位移延性系数
  s: number;         // 箍筋间距 (cm)
  D_prime?: number;  // 螺旋箍筋环直径 (cm)
  Ek: number;        // 输入冲击动能 (kJ)
  damage?: DamageParameters;
  reinforcement?: ReinforcementParameters;
}

export interface BridgeEcoConfig {
  cost_cfrp?: [number, number];   // 碳纤维包裹: [单价(元/m²), 工效]
  cost_jacket?: [number, number]; // 外包钢管混凝土: [单价(元/m), 工效]
  cost_fender?: [number, number]; // 柔性防撞套箱: [单价(元/套), 工效]
}

/**
 * 1. 核心计算模块：计算单柱抗剪承载力 Vn
 */
export const calculate_vn = (
  p: BridgeEngineParams & { damage_factor?: number },
  damageParam?: DamageParameters,
  reinforcementParam?: ReinforcementParameters
) => {
  const damage = damageParam || p.damage;
  const reinforcement = reinforcementParam || p.reinforcement;

  const Dst = p.Dst || 12;
  const cc = p.cc || 5;

  let fc = p.fc;
  let fyt = p.fyt;
  let effectiveDst = Dst;

  // 损伤折减
  if (damage) {
    if (damage.c_factor !== undefined) fc *= damage.c_factor;
    if (damage.phi_factor !== undefined) fyt *= damage.phi_factor;
    if (damage.component_damage_ratio) effectiveDst *= Math.max(0.2, 1 - damage.component_damage_ratio);
  }

  // 加固增强
  if (reinforcement) {
    if (reinforcement.cfrp_layers) effectiveDst *= (1 + reinforcement.cfrp_layers * 0.4);
    if (reinforcement.stirrup_amplification_factor) effectiveDst *= reinforcement.stirrup_amplification_factor;
    if (reinforcement.steel_plate_thickness) fc *= (1 + reinforcement.steel_plate_thickness * 0.05);
  }

  // 调用落石/水平冲击塑性铰算法引擎
  const rockfallRes = calculate_rockfall_impact_vn({
    D: p.D,
    Dst: effectiveDst,
    Nmin: p.Nmin,
    fc,
    fyt,
    miu_d: p.miu_d,
    s: p.s,
    cc
  });

  const Vc = rockfallRes.Vc;
  const Vs = 0.1 * (Math.PI / 2) * rockfallRes.Ast * fyt * rockfallRes.D_prime / Math.max(0.001, p.s);

  const totalVn = Vc + Vs;
  return { 
    Vn: p.damage_factor ? totalVn * p.damage_factor : totalVn, 
    Vc, 
    Vs,
    rockfallRes
  };
};

/**
 * 2. 状态评估模块：双折线能量-位移插值 (计算损伤度 αD)
 */
export const calculate_bridge_impact = (
  params: BridgeEngineParams & { damage_factor?: number },
  damageParam?: DamageParameters,
  reinforcementParam?: ReinforcementParameters
) => {
  const damage = damageParam || params.damage;
  const reinforcement = reinforcementParam || params.reinforcement;

  let Ek = params.Ek;

  if (damage && damage.E_factor) Ek *= (2 - damage.E_factor);
  if (reinforcement && reinforcement.seepage_barrier_factor) Ek *= Math.max(0.2, 1 - reinforcement.seepage_barrier_factor);

  const { Vn, Vc, Vs, rockfallRes } = calculate_vn(params, damage, reinforcement);

  const c1 = 1.94, c2 = 2.34;
  const Fs1 = c1 * Vn;
  const Fs2 = c2 * Vn;
  const delta_s1 = 0.02 * params.D;
  const delta_s2 = 0.1 * params.D;

  const C1 = 3.93, C2 = 1.81;
  const Ek1 = C1 * Fs1 * delta_s1;
  const Ek2 = C2 * Fs2 * delta_s2;

  let Fs: number, delta_s: number;

  if (Ek < Ek1) {
    Fs = (Fs1 / Math.max(0.01, Ek1)) * Ek;
    delta_s = (Fs / Math.max(0.01, Fs1)) * delta_s1;
  } else if (Ek < Ek2) {
    Fs = Fs1 + ((Fs2 - Fs1) / Math.max(0.01, Ek2 - Ek1)) * (Ek - Ek1);
    delta_s = ((Fs - Fs1) * (delta_s2 - delta_s1)) / Math.max(0.01, Fs2 - Fs1) + delta_s1;
  } else {
    Fs = Fs2;
    delta_s = delta_s2;
  }

  return {
    Fs,
    delta_s_cm: delta_s * 100, 
    alpha_D: delta_s / Math.max(0.001, params.D),
    Vn, Vc, Vs,
    rockfallRes
  };
};

/**
 * 3. 智能决策模块：桥梁加固正交推演 (力学补偿与耗能削减)
 */
export const optimize_bridge_reinforcement = (
  baseParams: BridgeEngineParams, 
  ecoConfig: BridgeEcoConfig,
  damageParam?: DamageParameters,
  reinforcementParam?: ReinforcementParameters
) => {
  const [price_cfrp, eff_cfrp] = ecoConfig.cost_cfrp || [800, 50];    
  const [price_jacket, eff_jacket] = ecoConfig.cost_jacket || [15000, 2]; 
  const [price_fender, eff_fender] = ecoConfig.cost_fender || [450000, 0.5]; 

  const schemes = [];

  // 方案 1：碳纤维 (CFRP) 环向包裹
  const params_1 = { ...baseParams, Ast: baseParams.Ast * 3.0, miu_d: Math.max(baseParams.miu_d, 8.0) };
  const res_1 = calculate_bridge_impact(params_1, damageParam, reinforcementParam);
  const area_cfrp = Math.PI * baseParams.D * 5.0 * 2; 
  const cost1_yuan = area_cfrp * price_cfrp;
  const cost1_wan = cost1_yuan / 10000;
  const time1 = area_cfrp / Math.max(0.01, eff_cfrp);

  schemes.push({
      id: 'S1', name: '方案一：碳纤维 (CFRP) 环向包裹',
      measures: ['CFRP抗剪增强'],
      cost: cost1_wan,
      time: time1,
      schedule: Math.round(time1),
      finalAlphaD: res_1.alpha_D, finalDisp: res_1.delta_s_cm,
      desc: '通过环向强约束提升抗剪上限与结构延性，施工快捷，不改变桥下通航净空。'
  });

  // 方案 2：外包钢管混凝土套裙 (增大截面法)
  const params_2 = { 
      ...baseParams, D: baseParams.D + 0.4, Ae: baseParams.Ae * 1.5, Ag: baseParams.Ag * 1.5, fc: baseParams.fc * 1.2 
  };
  const res_2 = calculate_bridge_impact(params_2, damageParam, reinforcementParam);
  const length_jacket = 8.0 * 2; 
  const cost2_yuan = length_jacket * price_jacket;
  const cost2_wan = cost2_yuan / 10000;
  const time2 = length_jacket / Math.max(0.01, eff_jacket);

  schemes.push({
      id: 'S2', name: '方案二：外包钢管混凝土套裙',
      measures: ['增大截面', '钢管约束'],
      cost: cost2_wan,
      time: time2,
      schedule: Math.round(time2),
      finalAlphaD: res_2.alpha_D, finalDisp: res_2.delta_s_cm,
      desc: '提供绝对的刚度与抗力双重保障，适用于存在严重重载撞击风险的航道墩柱。'
  });

  // 方案 3：增设柔性防撞套箱 (隔离耗能法)
  const params_3 = { ...baseParams, Ek: baseParams.Ek * 0.4 };
  const res_3 = calculate_bridge_impact(params_3, damageParam, reinforcementParam);
  const cost3_yuan = 2 * price_fender;
  const cost3_wan = cost3_yuan / 10000;
  const time3 = 2 / Math.max(0.01, eff_fender);

  schemes.push({
      id: 'S3', name: '方案三：复合材料柔性防撞套箱',
      measures: ['耗能缓冲', '撞击隔离'],
      cost: cost3_wan,
      time: time3,
      schedule: Math.round(time3),
      finalAlphaD: res_3.alpha_D, finalDisp: res_3.delta_s_cm,
      desc: '“以柔克刚”，在撞击发生瞬间吸收并耗散极大的动能，治标治本。'
  });

  const validSchemes = schemes.filter(s => s.finalAlphaD < 0.02);
  return validSchemes.length > 0 
      ? validSchemes.sort((a, b) => a.cost - b.cost) 
      : schemes.sort((a, b) => a.finalAlphaD - b.finalAlphaD);
};

export interface SeismicGirderParams {
  span: number;           // 主梁跨径 L (m)
  mass: number;           // 墩梁上部质量 M (t)
  K_total: number;        // 支座/墩柱总刚度 K_total (kN/mm)
  support_length: number; // 盖梁实际有效支撑长度 Na (mm)
  bridge_class: 'A' | 'B_express' | 'B_normal' | 'C'; // 桥梁类别
  site_class: 'I' | 'II' | 'III' | 'IV';              // 场地类别
  intensity: number;      // 烈度 (7: 0.1g, 8: 0.2g, 9: 0.4g)
}

/**
 * 基于抗震规范 E2 地震反应谱的梁体垮塌与落梁评估引擎
 * 参考 《梁体垮塌快速评估算例 v11》及 JTG/T 2231-01-2020
 */
export const calculate_girder_unseating = (p: SeismicGirderParams) => {
  // 1. 重要性系数 Ci & 场地系数 Cs 确定
  let Ci = 1.70;
  if (p.bridge_class === 'B_express') Ci = 1.70;
  else if (p.bridge_class === 'B_normal') Ci = 1.30;
  else if (p.bridge_class === 'C') Ci = 1.00;

  let Cs = 1.25; // 针对 III 类场地/VII度默认
  if (p.site_class === 'I') Cs = 0.85;
  else if (p.site_class === 'II') Cs = 1.00;
  else if (p.site_class === 'IV') Cs = 1.50;

  // 2. 反应谱与自振周期求解
  const g = 9.81;
  const T = 2 * Math.PI * Math.sqrt((p.mass * 1000) / (p.K_total * 1000000)); // 自振周期 T (s)
  const Tg = p.site_class === 'III' ? 0.45 : 0.35; // 特征周期 (s)

  // 设计反应谱加速度 Sa(T)
  const S_max = 2.25 * Ci * Cs * (p.intensity === 7 ? 0.1 : 0.2) * g;
  let Sa = S_max;
  if (T > Tg) {
    Sa = S_max * Math.pow(Tg / T, 0.9);
  }

  // 3. E2 地震作用下相对位移响应 Δrel (mm)
  const Sd = Sa / Math.pow((2 * Math.PI) / Math.max(0.1, T), 2); // 反应谱位移 (m)
  const delta_rel = Sd * 1000; // 换算为 mm

  // 4. 容许支撑长度 Na 与垮塌安全系数 SF 求解
  const Na_req = Math.max(600, 70 + 0.5 * p.span * 10); // 规范最小支撑 (mm)
  const Na_actual = p.support_length > 0 ? p.support_length : Na_req;
  const SF = Na_actual / Math.max(0.1, delta_rel); // 安全系数

  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (SF < 1.0) status = 'critical';
  else if (SF < 1.5) status = 'warning';

  return {
    T,
    Sa,
    delta_rel,
    Na_actual,
    Na_req,
    SF,
    Ci,
    Cs,
    status
  };
};

export interface DebrisFlowImpactParams {
  D: number;         // 桥墩直径 (m)
  Dst: number;       // 螺旋箍筋直径 (mm)
  Nmin: number;      // 墩柱截面最小轴力 (kN)
  fc: number;        // 混凝土抗压强度设计值 (MPa)
  fyt: number;       // 箍筋抗拉强度设计值 (MPa)
  miu_d: number;     // 延性系数
  s: number;         // 箍筋间距 (cm)
  cc: number;        // 保护层厚度 (cm)
  rho_df: number;    // 泥石流密度 (kg/m³)
  v_df: number;      // 泥石流速度 (m/s)
  H_df: number;      // 泥石流深度 (m)
}

/**
 * 泥石流冲击桥梁构件抗剪与损伤仿真计算
 * 参考《公路桥梁抗震设计规范》及泥石流冲击力经验模型
 */
export const calculate_debris_flow_component_damage = (params: DebrisFlowImpactParams) => {
  const { D, Dst, Nmin, fc, fyt, miu_d, s, cc, rho_df, v_df, H_df } = params;

  // 1. 构件截面几何与受力推导 (CalcVn 逻辑)
  const Ae = (Math.PI / 4) * Math.pow(D, 2) * 100;    // 面积 (cm²)
  const Ag = 0.8 * Ae;                               // 核心混凝土面积 (cm²)
  const Ast = (Math.PI / 4) * Math.pow(Dst, 2) / 100; // 箍筋面积 (cm²)
  const D_prime = 100 * D - 2 * cc;                  // 箍筋环直径 (cm)

  let rho_st = (4 * Ast) / Math.max(0.001, s * D_prime);
  if (rho_st > 2.4 / fyt) rho_st = 2.4 / fyt;

  let lamda = (rho_st * fyt) / 10 + 0.38 - 0.1 * miu_d;
  if (lamda < 0.03) lamda = 0.03;
  if (lamda > 0.3) lamda = 0.3;

  let vc = lamda * (1 + Nmin / Math.max(0.001, 1.38 * Ag)) * Math.sqrt(fc);
  if (vc < 0.355 * Math.sqrt(fc)) {
    vc = 0.355 * Math.sqrt(fc);
    if (vc < 1.47 * lamda * Math.sqrt(fc)) {
      vc = 1.47 * lamda * Math.sqrt(fc);
    }
  }
  const Vn = vc * Ae; // 截面抗剪承载力 (kN)

  // 2. 泥石流冲击推力 Fs 计算
  const c_rho = 0.1, c_v = 56, c_D = 150, c_H = 108;
  const Fs = c_rho * rho_df + c_v * v_df + c_D * D + c_H * H_df; // 冲击推力 (kN)

  // 3. 变形与损伤判别
  const delta_s1 = 0.02 * D; // 开裂临界位移 (m)
  const delta_s2 = 0.1 * D;  // 极限破坏位移 (m)
  const force_ratio = Fs / Math.max(0.001, Vn);

  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (force_ratio >= 1.0) status = 'critical';
  else if (force_ratio >= 0.6) status = 'warning';

  return {
    Vn,
    Fs,
    force_ratio,
    delta_s1,
    delta_s2,
    vc,
    lamda,
    status
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
  const factor_depth = Math.max(0.5, 1 - params.reinforcement_depth / 50.0); 
  const factor_corrosion = Math.max(0.4, 1 - params.corrosion_area_ratio * 0.8);
  const damage_factor = factor_depth * factor_corrosion;
  
  return {
    currentVn: params.baseVn * damage_factor,
    damage_factor,
    reduction_percentage: (1 - damage_factor) * 100
  };
};
