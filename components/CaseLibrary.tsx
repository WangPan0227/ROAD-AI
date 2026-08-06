import React from 'react';
import CaseKnowledgeLibrary from './common/CaseKnowledgeLibrary';

const CaseLibrary: React.FC<any> = (props) => {
  return <CaseKnowledgeLibrary sector="road" scenario="slope_instability" {...props} />;
};

export default CaseLibrary;
