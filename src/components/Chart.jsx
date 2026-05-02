import React, { Suspense, lazy } from "react";
import  styled  from "@emotion/styled";

// Dynamically import the ApexChart component
const ApexChart = lazy(() => import("react-apexcharts"));

// Styled component using @emotion/styled
const StyledChart = styled(ApexChart)`
  /* Add your styles here if needed */
`;

export  function Chart(props) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StyledChart {...props} />
    </Suspense>
  );
}
