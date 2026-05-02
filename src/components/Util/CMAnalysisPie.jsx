import React, { useEffect, useState } from "react";
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export default function CMPie(props) {
  const [aspect, setAspect] = useState(2.1);

  useEffect(() => {
    let d = (window.innerWidth / window.innerHeight).toFixed(1);
    setAspect(d);
  }, []);

  const renderLabel = (entry) => {
    return entry.name !== null ? entry.name : "No data";
  };

  return (
    <>
      {props.data && (
        <ResponsiveContainer height={"100%"} aspect={aspect}>
          <PieChart >
            <Pie
              data={props.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="50%"
              fill="#82ca9d"
              label={renderLabel}
            />
            <Tooltip />
            {/* <Legend verticalAlign="bottom" className="pieLegend" height={40} width={481} /> */}
          </PieChart>
        </ResponsiveContainer>
      )}
    </>
  );
}
