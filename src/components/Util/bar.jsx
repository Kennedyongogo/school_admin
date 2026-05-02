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
    let d = ((window.innerWidth * 0.65) / window.innerHeight).toFixed(1);
    setAspect(d);
  }, []);
  const barColors = ["#1f77b4", "#ff7f0e", "#2ca02c"];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "red",
            padding: "10px",
            borderRadius: "3px",
            border: "1px solid red",
            color: "white",
            boxShadow: "1px 1px 5px #60606050",
          }}
          className="custom-tooltip"
        >
          <p
            style={{ fontSize: "small", border: "1px solid red" }}
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
        <ResponsiveContainer height={"100%"} aspect={aspect}>
          <BarChart
            data={props.data}
            margin={{
              top: 5,
              bottom: 5,
              right: 15,
              left: -25,
            }}
          >
            <XAxis
              dataKey="name"
              tick={{ fill: "#217de6" }}
              tickLine={{ stroke: "#217de6" }}
            />
            <YAxis
              tick={{ fill: "#217de6" }}
              tickLine={{ stroke: "#217de6" }}
              //   label={{ value: "Incidences", fill: "white", angle:-90, offset:10 }}
            />
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              content={<CustomTooltip />}
            />
            <Bar
              dataKey="value"
              fill="#217de6"
              stroke="#000000"
              strokeWidth={0.1}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
