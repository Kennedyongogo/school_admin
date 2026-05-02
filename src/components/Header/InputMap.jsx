import React, { forwardRef, useEffect, useState } from "react";

const InputMap = (props, ref) => {
  const [value, setValue] = useState(props.value);

  const type = props.type ? props.type : "text";

  useEffect(() => {
    if (props.value != "") {
      setValue(props.value);
    }
  }, [props.value]);

  return (
    <div className="input-map">
      <label htmlFor="input">{props.label}</label>
      <input
        ref={ref}
        type={type}
        name="input"
        onChange={(e) => {
          setValue(e.target.value);
        }}
        placeholder={props.placeholder}
        value={value}
      />
    </div>
  );
};

export default forwardRef(InputMap);
