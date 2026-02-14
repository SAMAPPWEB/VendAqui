/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from "react";

interface RightPanelProps {
  children: React.ReactNode;
}

const RightPanel: React.FC<RightPanelProps> = ({ children }) => {
  return <>{children}</>;
};

export default RightPanel;
