import React from 'react';
import CaseKnowledgeLibrary from '../common/CaseKnowledgeLibrary';

const RetainingClassicCases: React.FC<any> = (props) => {
  return <CaseKnowledgeLibrary sector="road" scenario="retaining_structure" {...props} />;
};

export default RetainingClassicCases;
