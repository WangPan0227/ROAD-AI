import React from 'react';
import CaseKnowledgeLibrary from '../common/CaseKnowledgeLibrary';

const BridgeTypicalCases: React.FC<any> = (props) => {
  return <CaseKnowledgeLibrary sector="bridge" scenario="pier_impact" {...props} />;
};

export default BridgeTypicalCases;
