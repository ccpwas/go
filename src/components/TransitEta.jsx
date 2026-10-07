import React from 'react';
import RouteSearch from './RouteSearch';
import StopSearch from './StopSearch';

const TransitEta = ({ type }) => {
  if (type === 'stop') {
    return <StopSearch />;
  }

  return <RouteSearch />;
};

export default TransitEta;
