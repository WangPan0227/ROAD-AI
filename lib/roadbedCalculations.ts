import { DamageParameters, ReinforcementParameters } from '../types/schema';

export interface RoadbedEngineParams {
    H: number;              // 路基高度 (m)
    dz: number;             // 分层厚度 (m)
    E_req: number;          // 设计要求模量 (MPa)
    cbr: number;            // 基础CBR值
    compaction: number;     // 压实度 (0~1)
    rainfall: number;       // 降雨强度 (mm/day)
    rainDays: number;       // 降雨历时 (天)
    runoff_coeff: number;    // 径流系数 (0~1)
    compaction_loss: number; // 压实度损伤比例 (0~1)
    q_load: number;         // 附加荷载 (kPa)
    gamma: number;          // 土体重度 (kN/m³)
    damage?: DamageParameters;
    reinforcement?: ReinforcementParameters;
}

/**
 * 前端路基等效计算引擎 (基于一维入渗与分层压缩积分)
 */
export const calculate_roadbed_settlement = (
    params: RoadbedEngineParams,
    damageParam?: DamageParameters,
    reinforcementParam?: ReinforcementParameters
) => {
    const damage = damageParam || params.damage;
    const reinforcement = reinforcementParam || params.reinforcement;

    const { H, dz, E_req, rainDays, gamma } = params;
    let { cbr, compaction, rainfall, runoff_coeff, compaction_loss, q_load } = params;

    // 1. 前置损伤折减 (Damage Factors)
    if (damage) {
        if (damage.c_factor !== undefined) cbr *= damage.c_factor;
        if (damage.E_factor !== undefined) compaction_loss *= damage.E_factor;
        if (damage.crack_depth) rainfall *= (1 + damage.crack_depth * 0.2);
        if (damage.seismic_coefficient) q_load += damage.seismic_coefficient * gamma * H;
    }

    // 2. 后置加固力学增强 (Reinforcement Factors)
    if (reinforcement) {
        if (reinforcement.seepage_barrier_factor) {
            runoff_coeff = Math.min(0.98, runoff_coeff + (1 - runoff_coeff) * reinforcement.seepage_barrier_factor);
        }
        if (reinforcement.grouting_pressure || reinforcement.grouting_volume) {
            cbr *= 1.3;
            compaction = Math.min(0.99, compaction * 1.05);
        }
    }
    
    const n_layers = Math.ceil(H / dz);
    const z = Array.from({length: n_layers}, (_, i) => (i + 0.5) * dz);

    // 基础模量计算 (经验映射 CBR -> Mr)
    let E_base = cbr > 0 ? 22.1 * Math.pow(cbr, 0.55) : 60.0;
    
    // 压实度修正因子
    const comp_factor = Math.max(0.2, Math.pow((compaction * compaction_loss) / 0.96, 2.0));
    E_base = E_base * comp_factor;

    // 表观病害入渗边界映射
    const net_rain_m_per_day = (rainfall / 1000.0) * (1.0 - runoff_coeff);

    const times: number[] = [];
    const settlement_series: number[] = [];
    const capacity_series: number[] = [];
    
    let current_water_vol = 0;
    const capacity_per_m = 0.3;

    for (let day = 0; day <= 10; day += 0.5) {
        if (day <= rainDays) {
            current_water_vol += net_rain_m_per_day * 0.5;
        }
        
        const wetting_front = Math.min(H, current_water_vol / capacity_per_m);

        let total_settlement = 0;
        let sum_E = 0;

        for (let i = 0; i < n_layers; i++) {
            const depth = z[i];
            const sigma_z = gamma * depth + q_load * 0.3; 
            
            let ks = 0.95;
            if (depth <= wetting_front) {
                ks = 0.45;
            }

            const E_eq = Math.max(5.0, E_base * ks);
            sum_E += E_eq;

            const layer_settlement = (sigma_z / Math.max(0.1, E_eq * 1000)) * dz;
            total_settlement += layer_settlement;
        }

        const avg_E = sum_E / Math.max(1, n_layers);
        const capacity_pct = (avg_E / Math.max(0.01, E_req)) * 100;

        times.push(day);
        settlement_series.push(total_settlement * 1000);
        capacity_series.push(capacity_pct);
    }

    return {
        times,
        settlement_series,
        capacity_series,
        final_settlement: settlement_series[settlement_series.length - 1],
        final_capacity: capacity_series[capacity_series.length - 1],
        E_base
    };
};

export interface EcoConfig {
    cost_grout?: [number, number];   // [单价, 每日工效]
    cost_replace?: [number, number];
    cost_drain?: [number, number];
    cost_mpile?: [number, number];
}

/**
 * 路基加固方案正交推演引擎 (基于力学缺口与经济指标联动)
 */
export const optimize_roadbed_reinforcement = (
    baseParams: RoadbedEngineParams, 
    ecoConfig: EcoConfig,
    damageParam?: DamageParameters,
    reinforcementParam?: ReinforcementParameters
) => {
    const [price_grout, eff_grout] = ecoConfig.cost_grout || [450, 2000];
    const [price_replace, eff_replace] = ecoConfig.cost_replace || [180, 150];
    const [price_drain, eff_drain] = ecoConfig.cost_drain || [350, 80];
    const [price_mpile, eff_mpile] = ecoConfig.cost_mpile || [480, 50];

    const schemes = [];

    // 方案 1：原槽换填与表面封闭
    const params_1 = { ...baseParams, runoff_coeff: 0.80, compaction: Math.max(baseParams.compaction, 0.93) };
    const res_1 = calculate_roadbed_settlement(params_1, damageParam, reinforcementParam);
    const vol_replace = baseParams.H * 0.5 * 1.0; 
    const cost1 = vol_replace * price_replace;
    const time1 = vol_replace / Math.max(0.01, eff_replace);
    schemes.push({
        id: 'S1', name: '方案一：原槽换填与防水封闭',
        measures: ['原槽换填'],
        cost: cost1,
        time: time1,
        schedule: Math.round(time1),
        finalCapacity: res_1.final_capacity,
        finalSettlement: res_1.final_settlement,
        desc: '切断地表水入渗，适用于深层骨架未遭严重破坏的浅表层病害。'
    });

    // 方案 2：高聚物无损注浆
    const params_2 = { ...baseParams, runoff_coeff: 0.80, compaction: Math.max(baseParams.compaction, 0.96), cbr: baseParams.cbr * 1.2 };
    const res_2 = calculate_roadbed_settlement(params_2, damageParam, reinforcementParam);
    const weight_grout = baseParams.H * 45; 
    const cost2 = weight_grout * price_grout;
    const time2 = weight_grout / Math.max(0.01, eff_grout);
    schemes.push({
        id: 'S2', name: '方案二：高聚物无损注浆',
        measures: ['高聚物注浆'],
        cost: cost2,
        time: time2,
        schedule: Math.round(time2),
        finalCapacity: res_2.final_capacity,
        finalSettlement: res_2.final_settlement,
        desc: '快速挤密深层软弱土体，模量瞬间恢复，造价适中且可实现2小时开放交通。'
    });

    // 方案 3：高聚物注浆 + 增设深层盲沟
    const params_3 = { ...baseParams, runoff_coeff: 0.80, compaction: 0.96, cbr: baseParams.cbr * 1.3 };
    const res_3 = calculate_roadbed_settlement(params_3, damageParam, reinforcementParam);
    const cost3 = (weight_grout * price_grout) + (1.0 * price_drain);
    const time3 = (weight_grout / Math.max(0.01, eff_grout)) + (1.0 / Math.max(0.01, eff_drain));
    schemes.push({
        id: 'S3', name: '方案三：注浆联合深层排水',
        measures: ['高聚物注浆', '深层盲沟'],
        cost: cost3,
        time: time3,
        schedule: Math.round(time3),
        finalCapacity: res_3.final_capacity,
        finalSettlement: res_3.final_settlement,
        desc: '标本兼治，既恢复了路基模量，又彻底消除了高地下水位带来的水毁隐患。'
    });

    // 方案 4：微型钢管桩联合加固
    const params_4 = { ...baseParams, runoff_coeff: 0.80, compaction: 0.98, cbr: baseParams.cbr * 2.0 };
    const res_4 = calculate_roadbed_settlement(params_4, damageParam, reinforcementParam);
    const pile_length = baseParams.H * 1.5; 
    const cost4 = (pile_length * price_mpile) + (vol_replace * price_replace);
    const time4 = (pile_length / Math.max(0.01, eff_mpile)) + (vol_replace / Math.max(0.01, eff_replace));
    schemes.push({
        id: 'S4', name: '方案四：微型桩树根网联合加固',
        measures: ['微型钢管桩', '表面换填'],
        cost: cost4,
        time: time4,
        schedule: Math.round(time4),
        finalCapacity: res_4.final_capacity,
        finalSettlement: res_4.final_settlement,
        desc: '提供强大的复合刚度，适用于伴随深层滑动风险或承载力极度丧失的路基。'
    });

    // 排序逻辑：达标方案按造价升序，不达标按承载力降序
    const validSchemes = schemes.filter(s => s.finalCapacity >= 90);
    return validSchemes.length > 0 
        ? validSchemes.sort((a, b) => a.cost - b.cost) 
        : schemes.sort((a, b) => b.finalCapacity - a.finalCapacity);
};

