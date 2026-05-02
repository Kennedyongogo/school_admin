import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function Linechart(props) {
  const [aspect, setAspect] = useState(2.1);

  useEffect(() => {
    let d = (window.innerWidth*0.7 / window.innerHeight).toFixed(1);
    setAspect(d);
  }, []);
  return (
    <div>
      {props.data && (
        <ResponsiveContainer height={"100%"} aspect={aspect}>
          <LineChart
            data={props.data}
            margin={{
              top: 15,
              bottom: 5,
              right: 15,
              left: -25,
            }}
          >
            <XAxis
              dataKey="name"
              tick={{ fill: "white" }}
              tickLine={{ stroke: "white" }}
            />
            <YAxis tick={{ fill: "white" }} tickLine={{ stroke: "white" }} />
            <Tooltip />
            <Line dataKey="value" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
