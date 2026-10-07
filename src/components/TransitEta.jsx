import React from 'react';
import RouteSearch from './RouteSearch';
import StopSearch from './StopSearch';
import MtrSearch from './MtrSearch';
import TripPlanner from './TripPlanner';

const TransitEta = ({ type }) => {
  if (type === 'stop') {
    return <StopSearch />;
  }
  if (type === 'mtr') {
    return <MtrSearch />;
  }
  if (type === 'trip') {
    return <TripPlanner />;
  }

  return <RouteSearch />;
};

export default TransitEta;
