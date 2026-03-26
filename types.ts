
export enum Tab {
  Indicators = 'Indicators',
  Diseases = 'Diseases',
  MeasureLibrary = 'MeasureLibrary',
  DecisionModel = 'DecisionModel',
  Chatbot = 'Chatbot',
  CaseLibrary = 'CaseLibrary',
  HistoryLibrary = 'HistoryLibrary',
  CaseGenerator = 'CaseGenerator',
  DiseaseAtlas = 'DiseaseAtlas'
}

export interface Indicator {
  name: string;
  symbol?: string;
  description: string;
  method: string;
  standard?: string;
  category: 'Structure' | 'Strength' | 'Performance' | 'Material';
}

export interface Disease {
  name: string;
  category: string;
  indicators: string[];
  description: string;
  characteristics: string;
}

export type SoilType = 'granite' | 'clay' | 'soft_rock' | 'sand' | 'loess' | 'saline_soil' | 'expansive_soil';

export interface ReinforcementMeasure {
  id: string;
  name: string;
  suitability: string[];
  bestFor: string[]; 
  suitableDiseases?: string[]; // IDs from JTG_DISEASES
  unitCostCNY: number; 
  costIndex: number; 
  timeIndex: number; 
  difficultyIndex: number; 
  description?: string; 
  isNewTech?: boolean;
  technicalReliability: number; 
  durability: number; 
  ecoFriendliness: number;
  requiredMachinery: string[]; 
}

export interface CaseStudy {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  cause: string;
  mechanism: string;
  damageStats: {
    length: number;
    width: number;
    area: number;
    depth: number;
    volume?: number;
    casualties?: string;
  };
  environment: {
    rainfall: number;
    geology: string;
  };
  measuresUsed: string[];
  lessonsLearned: string[];
  imageUrl?: string;
  temperature?: number;
  load?: number;
  disasterType?: string;
}

export interface HistoricalCase {
  id: string;
  subgradeType: string;
  compaction: number;
  width: number;
  height: number;
  rainfall: number;
  groundWater: number;
  temperature: number;
  load: number;
  rockType: string;
  hasVisualFeatures: boolean;
  disasterArea: number | null;
  collapseRatio: number | null;
  settlementLevel: string | null;
  crackDensity: number | null;
  actualMeasures: string[];
  repairTime: number;
  successRate?: number;
  disasterType?: string;
}

export interface PredictionInput {
  roadLevel: 'highway' | 'first' | 'second';
  subgradeType: 'fill' | 'cut' | 'half';
  rockType: SoilType;
  compaction: number;
  width: number;
  height: number;
  rainfall: number;
  groundWater: number;
  temperature: number;
  load: number;
  disasterArea: number;
  crackDensity: number;
  crackWidth: number;
  collapseRatio: number; // %
  settlementLevel: 'light' | 'medium' | 'heavy';
  selectedDiseases?: string[]; // IDs of selected diseases
  hasVisualFeatures: boolean;
}

export interface SegmentInput extends PredictionInput {
  id: string;
  name: string; 
}

export interface MeasureUsage {
  measureId: string;
  measureName: string;
  area: number;
  cost: number;
  time: number; 
}

export interface RepairPrediction {
  disasterType: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  damageLevel: 'A' | 'B' | 'C' | 'D'; 
  recommendedMeasures: (ReinforcementMeasure & { 
    topsisScore: number; 
    reason: string; 
    isCombo?: boolean; 
    comboDetails?: string 
  })[];
  baseManHours: number;
  estimatedTime: number;
  personnelCount: number;
  estimatedCost: number; 
  confidence: number;
  factors: { name: string; value: number }[]; 
  timeBreakdown?: { step: string; time: number }[];
  optimization?: {
    suggestedPersonnel: number;
    suggestedMachinery: { name: string; count: number }[];
    optimizedTime: number;
    note: string;
  };
  sciResult?: {
    before: any; // SCICalculationResult
    after: any; // SCICalculationResult
    improvement: number; // %
  };
  indicatorResult?: {
    before: Record<string, number>;
    after: Record<string, number>;
  };
}

export interface SegmentResult extends RepairPrediction {
  segmentId: string;
  segmentName: string;
  measureDetails: MeasureUsage[]; 
}

export interface ProjectResult {
  totalTime: number; 
  totalCost: number;
  criticalSegmentsCount: number;
  segmentResults: SegmentResult[];
  projectMeasureSummary: MeasureUsage[]; 
}
