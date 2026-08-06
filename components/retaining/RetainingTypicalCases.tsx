import React from 'react';
import CaseKnowledgeLibrary from '../common/CaseKnowledgeLibrary';

const RetainingTypicalCases: React.FC<any> = (props) => {
  return <CaseKnowledgeLibrary sector="road" scenario="retaining_structure" {...props} />;
};

export default RetainingTypicalCases;
