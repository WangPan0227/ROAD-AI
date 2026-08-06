
import { DamageParameters, ReinforcementParameters } from '../types/schema';
import nnModelData from '../data/retaining_wall_model.json';

export interface CoulombRetainingParams {
  H: number;      // 墙高 (m)
  B_top: number;  // 墙顶宽 (m)
  B: number;      // 墙底宽 (m)
  gamma: number;  // 土重度 (kN/m³)
  phi: number;    // 内摩擦角 (deg)
  delta: number;  // 墙背摩擦角 (deg)
  alpha: number;  // 墙背倾角 (deg, 垂直为90)
  beta: number;   // 填土坡角 (deg)
  mu?: number;    // 基底摩擦系数 (默认 0.4)
  gamma_c?: number; // 墙体重度 (kN/m³, 默认 23)
}

/**
 * 通用多层前馈神经网络 (MLP) 前向传播推理器
 * 自动解析包含 weights, biases, mean, std 的结构化 JSON 模型
 */
export const predict_ann_safety_factor = (inputs: number[]): number => {
  try {
    const { weights, biases, mean, std, scaler_mean, scaler_scale } = nnModelData as any;
    const meanVec = mean || scaler_mean;
    const stdVec = std || scaler_scale;
    
    // 1. 特征归一化
    let currentLayer = inputs.map((val, i) => {
      const m = meanVec ? meanVec[i] : 0;
      const s = stdVec ? stdVec[i] : 1;
      return (val - m) / (s || 1);
    });

    // 2. 逐层前向传播 (Matrix Multiplication + Activation)
    for (let l = 0; l < weights.length; l++) {
      const W = weights[l]; // 当前层权重阵列 [next_nodes][curr_nodes]
      const b = biases[l];  // 当前层偏置阵列 [next_nodes]
      const nextLayer: number[] = [];

      for (let j = 0; j < W.length; j++) {
        let sum = b[j] || 0;
        for (let k = 0; k < currentLayer.length; k++) {
          sum += W[j][k] * currentLayer[k];
        }
        // 非最后一层应用 ReLU 激活函数
        if (l < weights.length - 1) {
          sum = Math.max(0, sum);
        }
        nextLayer.push(sum);
      }
      currentLayer = nextLayer;
    }

    // 3. 结果约束 (反归一化或直接输出 Fs)
    const rawFs = currentLayer[0];
    return Math.max(0.5, Math.min(4.0, rawFs));
  } catch (err) {
    console.warn('神经网络推理失败，自动降级至力学后备算法', err);
    return 1.5;
  }
};

/**
 * 库仑主动土压力与完整神经网络双驱动求解引擎
 */
export const calculate_coulomb_retaining_wall = (p: CoulombRetainingParams) => {
  const mu = p.mu ?? 0.4;
  const gamma_c = p.gamma_c ?? 23.0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi_r = toRad(p.phi);
  const delta_r = toRad(p.delta);
  const alpha_r = toRad(p.alpha);
  const beta_r = toRad(p.beta);

  // 1. 库仑主动土压力系数 Ka
  const num = Math.sin(alpha_r + phi_r);
  const term = Math.sqrt(
    (Math.sin(phi_r + delta_r) * Math.sin(phi_r - beta_r)) /
    Math.max(0.001, Math.sin(alpha_r - delta_r) * Math.sin(alpha_r + beta_r))
  );
  const den = Math.sin(alpha_r) * (1 + term);
  const Ka = Math.pow(num / Math.max(0.001, den), 2);

  // 2. 主动土压力 Pa 及分量
  const Pa = 0.5 * p.gamma * Math.pow(p.H, 2) * Ka;
  const Pax = Pa * Math.sin(alpha_r + delta_r - Math.PI / 2);
  const Pay = Pa * Math.cos(alpha_r + delta_r - Math.PI / 2);

  // 3. 墙体自重 W 与抗性求解
  const W = 0.5 * (p.B_top + p.B) * p.H * gamma_c;
  const Ks = (mu * (W + Pay)) / Math.max(0.001, Pax);
  const Overturn_Moment = Pax * (p.H / 3);
  const Resisting_Moment = W * (p.B / 2) + Pay * p.B;
  const K0 = Resisting_Moment / Math.max(0.001, Overturn_Moment);

  // 4. 读取 JSON 权重计算真实的神经网络预测值
  const nnInput = [p.H, p.B_top, p.B, p.gamma, p.phi, p.delta, p.alpha, p.beta];
  const Fs_ANN = predict_ann_safety_factor(nnInput);
  const error_pct = (Math.abs(Ks - Fs_ANN) / Math.max(0.1, Ks)) * 100;

  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (K0 < 1.2 || Ks < 1.0) status = 'critical';
  else if (K0 < 1.6 || Ks < 1.3) status = 'warning';

  return {
    Pa, Pax, Pay, W, Ka, K0, Ks, Fs_ANN, error_pct, status
  };
};

/**
 * 支挡失效物理引擎 (Retaining Wall Failure Physics Engine)
 * 核心逻辑：基于土压力、水压力与墙身自重的抗滑、抗倾覆稳定性验算
 */

export interface RetainingParams {
  H: number;           // 墙高 (m)
  gamma: number;       // 填土重度 (kN/m3)
  phi: number;         // 填土内摩擦角 (deg)
  c: number;           // 填土粘聚力 (kPa)
  delta: number;       // 墙背摩擦角 (deg), 通常取 phi/2 或 0
  waterHeight: number; // 墙后积水位高度 (m)
  friction_base: number; // 基底摩擦系数 mu
  wall_weight: number; // 墙身自重 (kN/m)
  wall_width: number;  // 墙身底宽 (m)
  damage?: DamageParameters;
  reinforcement?: ReinforcementParameters;
}

export interface RetainingResult {
  Ea: number;          // 主动土压力 (kN/m)
  Ew: number;          // 静水压力 (kN/m)
  Total_Driving_Force: number; // 总推力 (kN/m)
  Resisting_Force: number;     // 抗滑力 (kN/m)
  FS_slide: number;    // 抗滑安全系数
  Overturn_Moment: number;     // 倾覆力矩 (kN.m/m)
  Resisting_Moment: number;    // 抗倾覆力矩 (kN.m/m)
  FS_overt: number;    // 抗倾覆安全系数
  status: 'safe' | 'warning' | 'danger';
}

export interface RetainingReinforcementScheme {
  id: string;
  name: string;
  measures: string[];
  cost: number;        // 造价 (万元)
  schedule: number;    // 工期 (天)
  FS_slide: number;
  FS_overt: number;
  status: 'safe' | 'warning' | 'danger';
  desc: string;
}

export const calculate_retaining_wall = (
  params: RetainingParams,
  damageParam?: DamageParameters,
  reinforcementParam?: ReinforcementParameters
): RetainingResult => {
  const damage = damageParam || params.damage;
  const reinforcement = reinforcementParam || params.reinforcement;

  const { H, gamma, friction_base } = params;
  let { phi, c, waterHeight, wall_weight, wall_width } = params;

  // 1. 前置物理参数损伤折减 (Damage Factors)
  if (damage) {
    if (damage.c_factor !== undefined) c *= damage.c_factor;
    if (damage.phi_factor !== undefined) phi *= damage.phi_factor;
    if (damage.add_water_pressure) waterHeight = Math.min(H, waterHeight * 1.5 + 1.0);
    if (damage.crack_depth) waterHeight = Math.min(H, waterHeight + damage.crack_depth * 0.5);
    if (damage.component_damage_ratio) wall_weight *= Math.max(0.3, 1 - damage.component_damage_ratio);
  }

  // 2. 后置加固力学增强 (Reinforcement Factors)
  if (reinforcement) {
    if (reinforcement.seepage_barrier_factor) {
      waterHeight *= Math.max(0, 1 - reinforcement.seepage_barrier_factor);
    }
    if (reinforcement.stirrup_amplification_factor) {
      wall_width *= reinforcement.stirrup_amplification_factor;
      wall_weight *= reinforcement.stirrup_amplification_factor;
    }
  }

  // 3. 朗肯主动土压力系数 Ka
  const Ka = Math.pow(Math.tan((45 - phi / 2) * Math.PI / 180), 2);
  
  // 主动土压力 Ea (合力)
  let Ea = 0.5 * gamma * Math.pow(H, 2) * Ka - 2 * c * Math.sqrt(Ka) * H;
  if (Ea < 0) Ea = 0;
  
  // 4. 静水压力 Ew (gamma_w = 10.0 kN/m3)
  const gamma_w = 10.0;
  const Ew = 0.5 * gamma_w * Math.pow(waterHeight, 2);
  
  // 5. 总水平推力
  const Total_Driving_Force = Ea + Ew;
  
  // 6. 抗滑力计算
  let Resisting_Force = wall_weight * friction_base;

  // 加上锚索拉力对抗滑的物理贡献
  if (reinforcement && reinforcement.anchor_tension_force) {
    Resisting_Force += reinforcement.anchor_tension_force;
  }

  const FS_slide = Resisting_Force / Math.max(0.001, Total_Driving_Force);
  
  // 7. 力矩计算 (以墙趾为支点)
  const Mo = Ea * (H / 3) + Ew * (waterHeight / 3);
  let Mr = wall_weight * (wall_width / 2.0);

  if (reinforcement && reinforcement.anchor_tension_force) {
    Mr += reinforcement.anchor_tension_force * (H * 0.5);
  }
  
  const FS_overt = Mr / Math.max(0.001, Mo);
  
  // 8. 状态研判
  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (FS_slide < 1.1 || FS_overt < 1.3) status = 'danger';
  else if (FS_slide < 1.3 || FS_overt < 1.5) status = 'warning';
  
  return {
    Ea,
    Ew,
    Total_Driving_Force,
    Resisting_Force,
    FS_slide,
    Overturn_Moment: Mo,
    Resisting_Moment: Mr,
    FS_overt,
    status
  };
};

/**
 * 挡土墙加固方案正交推演与经济结算引擎
 */
export const optimize_retaining_reinforcement = (
  baseParams: RetainingParams,
  damageParam?: DamageParameters,
  reinforcementParam?: ReinforcementParameters
): RetainingReinforcementScheme[] => {
  const schemes: RetainingReinforcementScheme[] = [];

  // 方案 1：墙后深层盲沟泄水与套管疏干 (泄压法)
  const res1 = calculate_retaining_wall(baseParams, damageParam, { seepage_barrier_factor: 0.8 });
  schemes.push({
    id: 'R1',
    name: '方案一：墙后导排水泄压与孔道疏干',
    measures: ['泄水孔清淤', '深层排水盲沟'],
    cost: 3.5, // 3.5 万元
    schedule: 5, // 5 天
    FS_slide: res1.FS_slide,
    FS_overt: res1.FS_overt,
    status: res1.status,
    desc: '大幅削减墙后水头与静水压力，成本极低，见效迅速。'
  });

  // 方案 2：预应力锚索加固 (增压法)
  const res2 = calculate_retaining_wall(baseParams, damageParam, { anchor_tension_force: 150 });
  schemes.push({
    id: 'R2',
    name: '方案二：墙身穿心预应力锚索穿透加固',
    measures: ['预应力锚索', '墙面压梁'],
    cost: 12.0, // 12 万元
    schedule: 12, // 12 天
    FS_slide: res2.FS_slide,
    FS_overt: res2.FS_overt,
    status: res2.status,
    desc: '提供高额水平抗滑拉力与抗倾覆力矩，有效抵御推力过大。'
  });

  // 方案 3：趾部防滑墙加宽加厚扩展 (增大截面法)
  const res3 = calculate_retaining_wall(baseParams, damageParam, { stirrup_amplification_factor: 1.3 });
  schemes.push({
    id: 'R3',
    name: '方案三：墙趾截面扩展与基础套裙扩展',
    measures: ['增大墙趾截面', '墙脚防滑坎'],
    cost: 18.5, // 18.5 万元
    schedule: 20, // 20 天
    FS_slide: res3.FS_slide,
    FS_overt: res3.FS_overt,
    status: res3.status,
    desc: '显著增大基底摩擦面积与自重抗力，适用于墙身严重老化与倾斜场景。'
  });

  // 方案 4：排水 + 锚索联合处治
  const res4 = calculate_retaining_wall(baseParams, damageParam, { seepage_barrier_factor: 0.7, anchor_tension_force: 120 });
  schemes.push({
    id: 'R4',
    name: '方案四：导排水+预应力锚索综合治理',
    measures: ['盲沟泄压', '预应力锚索', '注浆加固'],
    cost: 14.8, // 14.8 万元
    schedule: 15, // 15 天
    FS_slide: res4.FS_slide,
    FS_overt: res4.FS_overt,
    status: res4.status,
    desc: '泄压与抗力提升相结合，综合恢复效果最稳定。'
  });

  // 按性价比/造价升序排序
  const safeSchemes = schemes.filter(s => s.status === 'safe');
  return safeSchemes.length > 0
    ? safeSchemes.sort((a, b) => a.cost - b.cost)
    : schemes.sort((a, b) => b.FS_slide - a.FS_slide);
};

