import React from 'react';
import CaseKnowledgeLibrary from '../common/CaseKnowledgeLibrary';

const BridgeClassicCases: React.FC<any> = (props) => {
  return <CaseKnowledgeLibrary sector="bridge" scenario="pier_impact" {...props} />;
};

export default BridgeClassicCases;
