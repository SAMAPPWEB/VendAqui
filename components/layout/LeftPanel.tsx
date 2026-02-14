/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from "react";

interface LeftPanelProps {
  children: React.ReactNode;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ children }) => {
  return <>{children}</>;
};

export default LeftPanel;
