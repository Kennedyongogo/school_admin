import React, { useEffect, useState } from "react";
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

export default function MyPie(props) {
  const [aspect, setAspect] = useState(2.1);

  useEffect(() => {
    let d = (window.innerWidth*0.7 / window.innerHeight).toFixed(1);
    setAspect(d);
  }, []);

  const renderLabel = (entry) => {
    return entry.name !== null ? entry.name : "No data";
  }

  return (
    <>
      {props.data && (
        <ResponsiveContainer height={"100%"} aspect={aspect}>
          <PieChart>
            <Pie
              data={props.data}
              dataKey="count"
              nameKey="Status"
              cx="50%"
              cy="50%"
              innerRadius="15%"
              outerRadius="40%"
              fill="#82ca9d"
              label={renderLabel}
            >
              {props.data?.map((entry, index) => (
                <Cell fill={props.colors[index]} style={{ fontSize: "12px" }} />
              ))}
            </Pie>
            <Tooltip />
            {/* <Legend verticalAlign="bottom" className="pieLegend" height={40} width={481} /> */}
          </PieChart>
        </ResponsiveContainer>
      )}
    </>
  );
}
