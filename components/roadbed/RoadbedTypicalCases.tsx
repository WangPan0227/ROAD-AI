import React from 'react';
import CaseKnowledgeLibrary from '../common/CaseKnowledgeLibrary';

const RoadbedTypicalCases: React.FC<any> = (props) => {
  return <CaseKnowledgeLibrary sector="road" scenario="subgrade_settlement" {...props} />;
};

export default RoadbedTypicalCases;
