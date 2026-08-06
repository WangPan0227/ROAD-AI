import React from 'react';
import CaseKnowledgeLibrary from '../common/CaseKnowledgeLibrary';

const TunnelClassicCases: React.FC<any> = (props) => {
  return <CaseKnowledgeLibrary sector="tunnel" scenario="rock_pressure" {...props} />;
};

export default TunnelClassicCases;
