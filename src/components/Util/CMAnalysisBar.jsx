import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function Barchart(props) {
  const [aspect, setAspect] = useState(2.1);

  useEffect(() => {
    let d = (window.innerWidth / window.innerHeight).toFixed(1);
    setAspect(d);
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p
            className="label"
            style={{ color: "black" }}
          >{`${label} : ${withCommas(payload[0]?.value)}`}</p>
        </div>
      );
    }

    return null;
  };

  function withCommas(x) {
    return x?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return (
    <div className="chrt">
      {props.data && (
        <ResponsiveContainer height={"110%"} aspect={aspect}>
          <BarChart
            data={props.data}
            margin={{
              top: 5,
              bottom: 5,
              right: 15,
              left: 5,
            }}
          >
            <XAxis
              dataKey="name"
              tick={{ fill: "white" }}
              tickLine={{ stroke: "white" }}
            />
            <YAxis tick={{ fill: "white" }} tickLine={{ stroke: "white" }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill="#DAF7A6"
              stroke="#000000"
              strokeWidth={0.1}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
