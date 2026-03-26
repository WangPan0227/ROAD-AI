export interface SoilLayer {
  top_elev: number;
  gamma: number;
  c: number;
  phi: number;
  desc: string;
}

export interface ProjectConfig {
  Geometry: {
    H: number;
    beta: number;
    W_slope: number;
  };
  Geotech: {
    soil_layers: SoilLayer[];
    tau_bond: number;
  };
  Water: {
    has_water: boolean;
    y_gwt: number;
    gamma_w: number;
  };
  Seismic: {
    k_h: number;
  };
  Target: {
    FS_target: number;
  };
  Economics: {
    cost_pile: [number, number];
    cost_anchor: [number, number];
    cost_cut: [number, number];
    cost_berm: [number, number];
  };
}

export const DEFAULT_CONFIG: ProjectConfig = {
  Geometry: {
    H: 10.0,
    beta: 45.0,
    W_slope: 30.0,
  },
  Geotech: {
    soil_layers: [
      { top_elev: 10.0, gamma: 18.0, c: 10.0, phi: 15.0, desc: "粉质粘土" },
      { top_elev: 5.0, gamma: 20.0, c: 25.0, phi: 22.0, desc: "强风化岩" },
      { top_elev: 0.0, gamma: 22.0, c: 50.0, phi: 30.0, desc: "中风化岩" },
    ],
    tau_bond: 60.0,
  },
  Water: {
    has_water: true,
    y_gwt: 4.0,
    gamma_w: 9.81,
  },
  Seismic: {
    k_h: 0.1,
  },
  Target: {
    FS_target: 1.15,
  },
  Economics: {
    cost_pile: [550.0, 40.0],
    cost_anchor: [220.0, 60.0],
    cost_cut: [35.0, 500.0],
    cost_berm: [55.0, 300.0],
  },
};

export const MATERIAL_LIB = {
  Steel_Q345: { f_y: 345000.0, desc: "Q345高强钢管" },
  Strand_1860: { f_y: 1860000.0, desc: "1860级高强钢绞线" },
};

export class StructureLib {
  static get_pile_bending_capacity(D: number, t_wall = 0.012, mat_key: keyof typeof MATERIAL_LIB = "Steel_Q345") {
    const f_y = MATERIAL_LIB[mat_key].f_y;
    const d = Math.max(D - 2 * t_wall, 0.001);
    return f_y * (Math.PI * (Math.pow(D, 4) - Math.pow(d, 4)) / (32 * D));
  }

  static get_anchor_tensile_capacity(d_diameter = 0.0152, count = 2, mat_key: keyof typeof MATERIAL_LIB = "Strand_1860") {
    return MATERIAL_LIB[mat_key].f_y * count * (Math.PI * Math.pow(d_diameter, 2) / 4.0);
  }
}

export function get_soil_properties(y: number, layers: SoilLayer[]) {
  let current_layer = layers[layers.length - 1];
  for (const layer of layers) {
    if (y <= layer.top_elev) {
      current_layer = layer;
      break;
    }
  }
  return { gamma: current_layer.gamma, c: current_layer.c, phi: current_layer.phi };
}

export function get_original_elevation(x: number, H: number, beta_rad: number) {
  const L_slope = H / Math.tan(beta_rad);
  if (x <= 0) return 0.0;
  if (x < L_slope) return x * Math.tan(beta_rad);
  return H;
}

export function compute_stability(geom_func: (x: number) => number, H_max: number, beta_rad: number, cfg: ProjectConfig) {
  const layers = cfg.Geotech.soil_layers;
  const water = cfg.Water;
  const seismic = cfg.Seismic;
  const L_slope = H_max / Math.tan(beta_rad);

  const xc_grid = Array.from({ length: 15 }, (_, i) => -0.5 * H_max + i * (L_slope + H_max) / 14);
  const yc_grid = Array.from({ length: 15 }, (_, i) => H_max + 0.1 * H_max + i * (1.4 * H_max) / 14);

  let min_FS = 999.0;
  let best_T = 0;
  let best_R = 0;
  let best_slip_depth = 0;
  let best_circle: [number, number, number] = [0, 0, 0];

  for (const Xc of xc_grid) {
    for (const Yc of yc_grid) {
      const R_min = Yc - H_max + 0.1;
      const R_max = Math.hypot(Xc, Yc) + 2.0;
      if (R_min > R_max) continue;

      const r_steps = 12;
      for (let i = 0; i < r_steps; i++) {
        const R = R_min + i * (R_max - R_min) / (r_steps - 1 || 1);
        
        const x_samples = Array.from({ length: 50 }, (_, j) => Xc - R + 0.01 + j * (2 * R - 0.02) / 49);
        const x_slip = x_samples.filter(x => {
          const val = R * R - (x - Xc) * (x - Xc);
          if (val < 0) return false;
          return (Yc - Math.sqrt(val)) < geom_func(x);
        });

        if (x_slip.length < 3) continue;
        const x_start = x_slip[0];
        const x_end = x_slip[x_slip.length - 1];
        if (x_end - x_start < 0.2 * H_max) continue;

        const num_slices = 25;
        const b = (x_end - x_start) / num_slices;
        const slices = [];
        let max_depth = 0.0;
        let valid_circle = true;

        for (let j = 0; j < num_slices; j++) {
          const xm = x_start + (j + 0.5) * b;
          const val = R * R - (xm - Xc) * (xm - Xc);
          const y_circ = Yc - Math.sqrt(Math.max(0, val));
          const y_surf = geom_func(xm);
          const h = y_surf - y_circ;
          
          if (h <= 0) {
            valid_circle = false;
            break;
          }

          max_depth = Math.max(max_depth, h);
          const alpha = Math.asin(Math.max(-0.99, Math.min(0.99, (xm - Xc) / R)));
          const { c: c_base, phi: phi_base } = get_soil_properties(y_circ, layers);
          const { gamma: gamma_avg } = get_soil_properties((y_surf + y_circ) / 2.0, layers);
          
          const W = gamma_avg * h * b;
          const u = (water.has_water && y_circ < water.y_gwt) ? water.gamma_w * (water.y_gwt - y_circ) : 0.0;

          slices.push({ W, alpha, b, c: c_base, phi: phi_base * Math.PI / 180.0, u });
        }

        if (!valid_circle) continue;

        let T_drive = 0;
        for (const s of slices) {
          T_drive += s.W * Math.sin(s.alpha) + seismic.k_h * s.W * Math.cos(s.alpha);
        }
        if (T_drive <= 0) continue;

        let FS_calc = 1.0;
        let R_resist = 0;
        for (let iter = 0; iter < 15; iter++) {
          R_resist = 0.0;
          for (const s of slices) {
            const N_eff = Math.max(s.W - s.u * s.b * Math.cos(s.alpha) - seismic.k_h * s.W * Math.sin(s.alpha), 0.0);
            const m_alpha = Math.max(0.01, Math.cos(s.alpha) * (1.0 + Math.tan(s.alpha) * Math.tan(s.phi) / FS_calc));
            R_resist += (s.c * s.b + N_eff * Math.tan(s.phi)) / m_alpha;
          }
          const FS_new = R_resist / T_drive;
          if (Math.abs(FS_new - FS_calc) < 1e-3) break;
          FS_calc = FS_new;
        }

        if (FS_calc > 0 && FS_calc < min_FS) {
          min_FS = FS_calc;
          best_T = T_drive;
          best_R = R_resist;
          best_slip_depth = max_depth;
          best_circle = [Xc, Yc, R];
        }
      }
    }
  }

  return { min_FS, best_T, best_R, best_slip_depth, best_circle };
}

export function calc_structural_compensation(
  R_req_unit: number, T_unit: number, R_soil_unit: number, slip_depth: number,
  cfg: ProjectConfig, orig_circle: [number, number, number], prefix: string,
  geo_cost = 0, geo_time = 0, geo_param = "", geo_plot_data: any = null
) {
  const solutions = [];
  const M_u = StructureLib.get_pile_bending_capacity(0.2);
  const T_struct = StructureLib.get_anchor_tensile_capacity();
  const tau = cfg.Geotech.tau_bond;
  const eco = cfg.Economics;
  const W_slope = cfg.Geometry.W_slope;

  // 1. Pure Pile
  let best_p_cost = Infinity;
  let best_p_sol = null;
  for (const L of [8, 10, 12, 15]) {
    for (const spacing of [1.0, 1.2, 1.5]) {
      const Q_single = Math.min(Math.max((L - slip_depth) * 60.0, 0.0), M_u / (slip_depth / 2 + 0.1));
      const R_prov = Q_single / spacing;
      if (R_prov >= R_req_unit) {
        const n_total = Math.floor(W_slope / spacing) + 1;
        const cost = geo_cost + (n_total * L * eco.cost_pile[0] / 10000);
        if (cost < best_p_cost) {
          best_p_cost = cost;
          const p_data = geo_plot_data ? { ...geo_plot_data } : { type: "orig", circle: orig_circle };
          p_data.sub_type = "pile";
          p_data.L = L;
          p_data.spacing = spacing;
          best_p_sol = {
            Method: prefix + "微型桩",
            FS: Number(((R_soil_unit + R_prov) / T_unit).toFixed(3)),
            Cost_W: cost,
            Time_d: geo_time + (n_total * L / eco.cost_pile[1]),
            Param: geo_param + `桩L=${L}m,@=${spacing}m`,
            Plot_Data: p_data
          };
        }
      }
    }
  }
  if (best_p_sol) solutions.push(best_p_sol);

  // 2. Pure Anchor
  let best_a_cost = Infinity;
  let best_a_sol = null;
  for (const L_bond of [6, 8, 10]) {
    for (const spacing of [1.5, 2.0, 2.5]) {
      const T_design = Math.min(Math.PI * 0.15 * L_bond * tau, T_struct) / 1.5;
      const R_prov = (T_design * Math.cos((15 - 30) * Math.PI / 180.0)) / spacing;
      if (R_prov >= R_req_unit) {
        const total_L = (L_bond + 5) * (Math.floor(W_slope / spacing) + 1);
        const cost = geo_cost + (total_L * eco.cost_anchor[0] / 10000);
        if (cost < best_a_cost) {
          best_a_cost = cost;
          const p_data = geo_plot_data ? { ...geo_plot_data } : { type: "orig", circle: orig_circle };
          p_data.sub_type = "anchor";
          p_data.L_total = L_bond + 5;
          p_data.spacing = spacing;
          best_a_sol = {
            Method: prefix + "锚索",
            FS: Number(((R_soil_unit + R_prov) / T_unit).toFixed(3)),
            Cost_W: cost,
            Time_d: geo_time + (total_L / eco.cost_anchor[1]),
            Param: geo_param + `锚固L_b=${L_bond}m,@=${spacing}m`,
            Plot_Data: p_data
          };
        }
      }
    }
  }
  if (best_a_sol) solutions.push(best_a_sol);

  // 3. Pile + Anchor
  const R_req_half = R_req_unit * 0.5;
  if (R_req_half > 0) {
    let best_half_p_cost = Infinity;
    let best_half_p_params: any = null;
    for (const L of [8, 10, 12]) {
      for (const spacing of [1.5, 2.0]) {
        const Q_single = Math.min(Math.max((L - slip_depth) * 60.0, 0.0), M_u / (slip_depth / 2 + 0.1));
        if (Q_single / spacing >= R_req_half) {
          const n_t = Math.floor(W_slope / spacing) + 1;
          const c = n_t * L * eco.cost_pile[0] / 10000;
          if (c < best_half_p_cost) {
            best_half_p_cost = c;
            best_half_p_params = { L, s: spacing, R: Q_single / spacing, time: n_t * L / eco.cost_pile[1] };
          }
        }
      }
    }

    let best_half_a_cost = Infinity;
    let best_half_a_params: any = null;
    for (const L_bond of [4, 6, 8]) {
      for (const spacing of [2.0, 2.5, 3.0]) {
        const T_design = Math.min(Math.PI * 0.15 * L_bond * tau, T_struct) / 1.5;
        const R_prov = (T_design * Math.cos((15 - 30) * Math.PI / 180.0)) / spacing;
        if (R_prov >= R_req_half) {
          const t_L = (L_bond + 5) * (Math.floor(W_slope / spacing) + 1);
          const c = t_L * eco.cost_anchor[0] / 10000;
          if (c < best_half_a_cost) {
            best_half_a_cost = c;
            best_half_a_params = { Lb: L_bond, s: spacing, R: R_prov, time: t_L / eco.cost_anchor[1] };
          }
        }
      }
    }

    if (best_half_p_params && best_half_a_params) {
      const cost = geo_cost + best_half_p_cost + best_half_a_cost;
      const p_data = geo_plot_data ? { ...geo_plot_data } : { type: "orig", circle: orig_circle };
      p_data.sub_type = "pile_anchor";
      p_data.L = best_half_p_params.L;
      p_data.L_total = best_half_a_params.Lb + 5;
      p_data.spacing = Math.max(best_half_p_params.s, best_half_a_params.s);

      solutions.push({
        Method: prefix + "桩锚联合",
        FS: Number(((R_soil_unit + best_half_p_params.R + best_half_a_params.R) / T_unit).toFixed(3)),
        Cost_W: cost,
        Time_d: geo_time + best_half_p_params.time + best_half_a_params.time,
        Param: geo_param + `桩L=${best_half_p_params.L}m,@=${best_half_p_params.s}m\n锚Lb=${best_half_a_params.Lb}m,@=${best_half_a_params.s}m`,
        Plot_Data: p_data
      });
    }
  }

  return solutions;
}

export function eval_all_combinations_matrix(
  geom: ProjectConfig['Geometry'], cfg: ProjectConfig, target_FS: number,
  T0: number, R0: number, slip0: number, circ0: [number, number, number]
) {
  const all_schemes = [];
  const eco = cfg.Economics;
  const orig_geom = (x: number) => get_original_elevation(x, geom.H, geom.beta * Math.PI / 180.0);

  // A0: Original
  const R_req_0 = Math.max(target_FS * T0 - R0, 0.0);
  if (R_req_0 > 0) {
    const sols_a0 = calc_structural_compensation(R_req_0, T0, R0, slip0, cfg, circ0, "");
    all_schemes.push(...sols_a0);
  }

  // A1/A2: Cut
  for (const cut_ratio of [1.2, 1.5]) {
    const beta_new = Math.atan(1.0 / cut_ratio);
    const cut_geom = (x: number) => Math.min(orig_geom(x), get_original_elevation(x, geom.H, beta_new));
    const { min_FS: FS_c, best_T: T_c, best_R: R_c, best_slip_depth: slip_c, best_circle: circ_c } = compute_stability(cut_geom, geom.H, geom.beta * Math.PI / 180.0, cfg);
    
    const vol_c = 0.5 * Math.pow(geom.H, 2) * (cut_ratio - 1.0 / Math.tan(geom.beta * Math.PI / 180.0)) * geom.W_slope;
    const cost_c = vol_c * eco.cost_cut[0] / 10000;
    const time_c = vol_c / eco.cost_cut[1];
    const param_c = `削坡1:${cut_ratio}\n`;
    const plot_data_c = { type: "cut", ratio: cut_ratio, circle: circ_c };

    if (FS_c >= target_FS) {
      all_schemes.push({
        Method: `纯削坡(1:${cut_ratio})`,
        FS: Number(FS_c.toFixed(3)),
        Cost_W: cost_c,
        Time_d: time_c,
        Param: `挖方=${Math.floor(vol_c)}m³`,
        Plot_Data: plot_data_c
      });
    } else {
      const R_req_c = Math.max(target_FS * T_c - R_c, 0.0);
      const sols_c = calc_structural_compensation(R_req_c, T_c, R_c, slip_c, cfg, circ_c, `削坡(1:${cut_ratio})+`, cost_c, time_c, param_c, plot_data_c);
      all_schemes.push(...sols_c);
    }
  }

  // A3/A4: Berm
  const berm_configs = [[2.0, 3.0], [3.0, 5.0]];
  for (const [H_b, B_b] of berm_configs) {
    const berm_geom = (x: number) => Math.max(orig_geom(x), x <= B_b ? H_b : Math.max(0, H_b - (x - B_b) * Math.tan(geom.beta * Math.PI / 180.0)));
    const { min_FS: FS_b, best_T: T_b, best_R: R_b, best_slip_depth: slip_b, best_circle: circ_b } = compute_stability(berm_geom, geom.H, geom.beta * Math.PI / 180.0, cfg);
    
    const vol_b = (H_b * B_b + 0.5 * H_b * (H_b / Math.tan(geom.beta * Math.PI / 180.0))) * geom.W_slope;
    const cost_b = vol_b * eco.cost_berm[0] / 10000;
    const time_b = vol_b / eco.cost_berm[1];
    const param_b = `压重(${H_b}x${B_b})\n`;
    const plot_data_b = { type: "berm", H: H_b, B: B_b, circle: circ_b };

    if (FS_b >= target_FS) {
      all_schemes.push({
        Method: `纯压重(${H_b}x${B_b}m)`,
        FS: Number(FS_b.toFixed(3)),
        Cost_W: cost_b,
        Time_d: time_b,
        Param: `填方=${Math.floor(vol_b)}m³`,
        Plot_Data: plot_data_b
      });
    } else {
      const R_req_b = Math.max(target_FS * T_b - R_b, 0.0);
      const sols_b = calc_structural_compensation(R_req_b, T_b, R_b, slip_b, cfg, circ_b, `压重+`, cost_b, time_b, param_b, plot_data_b);
      all_schemes.push(...sols_b);
    }
  }

  return all_schemes.sort((a, b) => a.Cost_W - b.Cost_W);
}
