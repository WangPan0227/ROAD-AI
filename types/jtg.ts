
export enum DiseaseCategory {
  Shoulder = '路肩病害',
  Embankment = '路堤与路床病害',
  Slope = '边坡病害',
  Protection = '既有防护及支挡结构物病害',
  Drainage = '排水设施病害',
}

export interface DiseaseType {
  id: string;
  name: string;
  category: DiseaseCategory;
  description: string;
  deduction: number;
  weight: number;
}

export interface SubIndex {
  name: string;
  code: string;
  weight: number;
  score: number;
}

export interface SCICalculationResult {
  SCI: number;
  subIndices: SubIndex[];
}

export const JTG_DISEASES: DiseaseType[] = [
  { id: 'shoulder_defect', name: '路肩或路缘石缺损', category: DiseaseCategory.Shoulder, description: '路肩缺口、路缘石丢失/损坏', deduction: 5, weight: 0.4 },
  { id: 'shoulder_drainage', name: '阻挡路面排水', category: DiseaseCategory.Shoulder, description: '路肩高于路面', deduction: 10, weight: 0.4 },
  { id: 'shoulder_unclean', name: '路肩不洁', category: DiseaseCategory.Shoulder, description: '杂物堆积、杂草过高', deduction: 2, weight: 0.2 },
  { id: 'embankment_debris', name: '杂物堆积', category: DiseaseCategory.Embankment, description: '垃圾、秸秆堆积', deduction: 5, weight: 0.2 },
  { id: 'embankment_settlement', name: '不均匀沉降', category: DiseaseCategory.Embankment, description: '差异沉降>4cm', deduction: 20, weight: 0.3 },
  { id: 'embankment_crack', name: '开裂滑移', category: DiseaseCategory.Embankment, description: '纵向弧形开裂', deduction: 50, weight: 0.3 },
  { id: 'embankment_frost', name: '冻胀翻浆', category: DiseaseCategory.Embankment, description: '路面隆起、冒浆', deduction: 20, weight: 0.2 },
  { id: 'slope_erosion', name: '坡面冲刷', category: DiseaseCategory.Slope, description: '冲刷沟槽>10cm', deduction: 5, weight: 0.2 },
  { id: 'slope_collapse', name: '碎落崩塌', category: DiseaseCategory.Slope, description: '碎石滚落', deduction: 20, weight: 0.25 },
  { id: 'slope_local_collapse', name: '局部坍塌', category: DiseaseCategory.Slope, description: '松散破碎、滑塌', deduction: 50, weight: 0.25 },
  { id: 'slope_landslide', name: '滑坡', category: DiseaseCategory.Slope, description: '整体剪切破坏', deduction: 100, weight: 0.3 },
  { id: 'protection_damage', name: '表观破损', category: DiseaseCategory.Protection, description: '勾缝脱落、钢筋锈蚀', deduction: 10, weight: 0.1 },
  { id: 'protection_clogging', name: '排(泄)水孔淤塞', category: DiseaseCategory.Protection, description: '排水不畅', deduction: 20, weight: 0.2 },
  { id: 'protection_local_damage', name: '局部损坏', category: DiseaseCategory.Protection, description: '基础淘空、墙体脱空', deduction: 20, weight: 0.3 },
  { id: 'protection_instability', name: '结构失稳', category: DiseaseCategory.Protection, description: '开裂、倾斜、倒塌', deduction: 100, weight: 0.4 },
  { id: 'drainage_clogging', name: '排水设施堵塞', category: DiseaseCategory.Drainage, description: '淤积、杂物', deduction: 5, weight: 0.5 },
  { id: 'drainage_damage', name: '排水设施损坏', category: DiseaseCategory.Drainage, description: '勾缝脱落、破损', deduction: 10, weight: 0.5 },
  { id: 'drainage_imperfect', name: '排水设施不完善', category: DiseaseCategory.Drainage, description: '缺失、衔接无效', deduction: 0, weight: 0 },
];

export const SUB_INDICES_CONFIG = [
  { code: 'VSCI', name: '路肩技术状况指数', weight: 0.1, category: DiseaseCategory.Shoulder },
  { code: 'ESCI', name: '路堤与路床技术状况指数', weight: 0.2, category: DiseaseCategory.Embankment },
  { code: 'SSCI', name: '边坡技术状况指数', weight: 0.25, category: DiseaseCategory.Slope },
  { code: 'RSCI', name: '既有防护及支挡结构物技术状况指数', weight: 0.25, category: DiseaseCategory.Protection },
  { code: 'DSCI', name: '排水设施技术状况指数', weight: 0.2, category: DiseaseCategory.Drainage },
];
